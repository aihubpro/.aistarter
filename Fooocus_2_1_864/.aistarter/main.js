{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		console.log('Plugin Inited:', this.pluginName);
		
		this.runInstance = null
		
		this.addDir();

	},
	
	//执行下载
	download:async function(){
		console.log("plugin download!!");
		await zn.downloadProjectTorrent(this.pluginName);
	},
	
	//执行安装
	install:async function(){

		let pluginNmae = this.pluginName; //AI软件目录名

		try {

			// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
			await zn.markPluginInstalled(pluginNmae);

		} catch (error) {
			console.error(`Error executing command: ${error.message}`);
		}

	},
	
	//运行
	run:async function(){	
		if(this.runInstance){
			console.log(this.runInstance.pid)
			//this.runInstance.stdin.write("stop")
			//this.runInstance.stdin.end();
			
			zn.killProcessTree(this.runInstance.pid);
			
			//this.runInstance.kill('SIGKILL');
			
			this.runInstance = null
			return;
		}
		
		zn.showLoading(true, "正在启动，请耐心等候！");
		
		//回调
		let callback = {
			created:(process) => {
				this.runInstance = process
			},
			stdout:(data) => {
				if(data.toString().includes("Running")){
					zn.showLoading(false);
				}
			}
		}
		
		const options = {
			cwd: this.pluginPath
		};
		
		let runMode = await zn.getSettingValue('RunMode', "Fooocus_2_1_864");
		
		let cmdStr = "";
		
		if(runMode == 2){
			cmdStr = `.\\python_embeded\\python.exe -u -s Fooocus\\entry_with_update.py --preset anime --language zh`;
		}else if(runMode == 3){
			cmdStr = `.\\python_embeded\\python.exe -u -s Fooocus\\entry_with_update.py --preset realistic --language zh`;
		}else{
			cmdStr = `.\\python_embeded\\python.exe -u -s Fooocus\\entry_with_update.py --language zh`;
		}
		
		try {
			await zn.execute('cmd.exe', ['/c', cmdStr], options, callback)
		} catch (error) {
			console.error(error.message);
			if(this.runInstance){
				zn.showMessage("启动失败请查看终端日志！");
				zn.changeBtnState(this.pluginName, "run");
				this.runInstance = null;
			}

		}
		
		zn.showLoading(false);
		
	},
	
	//点击退出
	exit:async function(){
		if(this.runInstance){
			let pid = this.runInstance.pid;
			this.runInstance = null
			zn.killProcessTree(pid);
		}
	},
	
	//软件退出时调用
	onAppExit:async function(){
		this.exit();
	},
	
	//是否正在运行
	isRunning:async function(){
		return this.runInstance != null;
	},
	
	//添加目录
	addDir:async function(){
		let isInstalled = await zn.isPluginInstalled(this.pluginName);
		if(isInstalled){
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"主程序目录", viewPath:`.\\${this.pluginName}\\Fooocus`, dirPath:`\\Products\\${this.pluginName}\\Fooocus`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型目录", viewPath:`..\\Fooocus\\models`, dirPath:`.\\${this.pluginName}\\Fooocus\\models`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"输出目录", viewPath:`..\\Fooocus\\outputs`, dirPath:`.\\${this.pluginName}\\Fooocus\\\\outputs`});

		}
	},
	
	//设置菜单
	addSetting:async function(){
		const settings = {className:"Fooocus_2_1_864", title:"Fooocus 2.1.864设置", configList:[
		  {
	        key: 'RunMode',
			label:'启动模式',
			type: 'select',
			options: [
			  { label: '原版', value: 1 },
			  { label: '漫画风格', value: 2 },
			  { label: '照片风格', value: 3 }
			],
			default: 1
		  }
		]};
		
		return settings;
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
	
}