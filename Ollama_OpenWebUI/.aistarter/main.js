{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		console.log('Plugin Inited:', this.pluginName);
		
		this.runInstance = null;
		
		this.runServerInstance = null; //ollama服务端实例


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
		if(this.runInstance || this.runServerInstance){
			if(this.runInstance){
				zn.killProcessTree(this.runInstance.pid);
				this.runInstance = null
			}
			
			if(this.runServerInstance){
				zn.killProcessTree(this.runServerInstance.pid);
				this.runServerInstance = null
			}
		
			return;
		}
		
		zn.showLoading(true, "正在启动，请耐心等候！");
		
		let serverCallback = {
			created:(process) => {
				this.runServerInstance = process
				
				// 运行webui
				this.runWebUI();
			}
		}
		
		const serverOptions = {
			cwd: this.pluginPath + "\\ollama-windows-amd64",
			env:{OLLAMA_MODELS:this.pluginPath + "\\models"}
		};
		
		try {
			await zn.execute('ollama.exe', ['serve'], serverOptions, serverCallback)
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
	
	runWebUI:async function(){
		//回调
		let callback = {
			created:(process) => {
				this.runInstance = process
			},
			stderr:(data) => {
				if(data.toString().includes("http://0.0.0.0:8080")){
					zn.showLoading(false);
					zn.execute('cmd.exe', ['/c', `start http://localhost:8080/`]);
				}
			}
		}
		
		let envPath = process.env.PATH;
		//追加python 环境
		envPath = `${this.pluginPath}\\open-webui\\venv\\Scripts;` + envPath;
		
		const options = {
			cwd: this.pluginPath + "\\open-webui",
			env:{PATH: envPath, HUGGINGFACE_HUB_CACHE:this.pluginPath + "\\.cache"}
		};
		
		
		try {
			await zn.execute('cmd.exe', ['/c', `.\\venv\\Scripts\\open-webui.exe serve`], options, callback)
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
		
		if(this.runServerInstance){
			let pid = this.runServerInstance.pid;
			this.runServerInstance = null
			zn.killProcessTree(pid);
		}
	},
	
	//软件退出时调用
	onAppExit:async function(){
		this.exit();
	},
	
	//是否正在运行
	isRunning:async function(){
		return this.runInstance != null && this.runServerInstance != null;
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
	
}