{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		console.log('Plugin Inited:', this.pluginName);
		
		this.runInstance = null

		this.addDir();

	},
	//执行安装
	install:async function(){

		// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
		await zn.markPluginInstalled(this.pluginName);
		
		this.addDir();

	},
	
	//执行下载
	download:async function(){
		console.log("plugin download!!");
		await zn.downloadProjectTorrent(this.pluginName);
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
		
		zn.showLoading(true, "正在启动，启动时间比较长请耐心等候！");
		
		let runMode = await zn.getSettingValue('RunMode', "BlenderComfyUI");
		
		let useCpu = "";
		if(runMode != "gpu"){
			useCpu = " --cpu"
		}
		
		//回调
		let callback = {
			created:(process) => {
				this.runInstance = process
			},
			stdout:(data) => {
				let stdoutStr = data.toString();
				if(stdoutStr.includes("Starting")){
					zn.showLoading(false);
				}
			}
		}
		
		const options = {
			cwd: `${this.pluginPath}\\Blender_ComfyUI_Mini`
		};
		
		try {
			await zn.execute('cmd.exe', ['/c', `.\\python_embeded\\python.exe -u -s ComfyUI\\main.py${useCpu} --windows-standalone-build`], options, callback);
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
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"ComfyUI根目录", viewPath:`..\\ComfyUI`, dirPath:`\\Products\\${this.pluginName}\\Blender_ComfyUI_Mini\\ComfyUI`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型目录", viewPath:`..\\ComfyUI\\models`, dirPath:`\\Products\\${this.pluginName}\\Blender_ComfyUI_Mini\\ComfyUI\\models`});
		}
	},
	
	//设置菜单
	addSetting:async function(){
		const settings = {className:"BlenderComfyUI", title:"铁锅炖ComfyUI设置", configList:[
		  {
	        key: 'RunMode',
			label:'启动模式',
			type: 'select',
			options: [
			  { label: 'CPU', value: 'cpu' },
			  { label: 'GPU', value: 'gpu' },
			  // ...其他 GPU 选项
			],
			default: 'cpu'
		  }
		]};
		
		return settings;
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
	
}