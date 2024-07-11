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
				if(data.toString().includes("Current")){
					zn.showLoading(false);
				}
			}
		}
		
		const options = {
			cwd: `${this.pluginPath}\\so-vits-svc`
		};
		
		try {
			await zn.execute('cmd.exe', ['/c', 'run_webui.bat'], options, callback)
		} catch (error) {
			console.error(error.message);
		}
		
		zn.showLoading(false);
		
	},
	
	//点击退出
	exit:async function(){
		if(this.runInstance){
			zn.killProcessTree(this.runInstance.pid);
			this.runInstance = null
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
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"SoVitsSvc目录", viewPath:`.\\${this.pluginName}\\so-vits-svc`, dirPath:`\\Products\\${this.pluginName}\\so-vits-svc`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型目录", viewPath:`.\\${this.pluginName}\\so-vits-svc\\models`, dirPath:`\\Products\\${this.pluginName}\\so-vits-svc-4.1\\models`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"预训练模型", viewPath:`..\\logs\\44k`, dirPath:`\\Products\\${this.pluginName}\\so-vits-svc\\logs\\44k`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"扩散模型", viewPath:`..\\logs\\44k\\diffusion`, dirPath:`\\Products\\${this.pluginName}\\so-vits-svc\\logs\\44k\\diffusion`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"声音编码器", viewPath:`..\\logs\\44k\\pretrain`, dirPath:`\\Products\\${this.pluginName}\\so-vits-svc\\logs\\44k\\pretrain`});
			

		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
	
}