{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		let envPath = process.env.PATH;
		//追加python 环境
		envPath = `${pluginPath}\\Third\\python-3.10.6;` + envPath;
		envPath = `${pluginPath}\\Third\\python-3.10.6\\Scripts;` + envPath;
		//追加ffmpeg环境
		envPath = `${pluginPath}\\Third\\ffmpeg-6.1\\bin;` + envPath;
		
		let tclLibrary = `${pluginPath}\\Third\\python-3.10.6\\tcl\\tcl8.6`;
		let tkLibrary = `${pluginPath}\\Third\\python-3.10.6\\tcl\\tk8.6`;
		
		//临时的环境变量
		this.newEnv = { PATH: envPath, TCL_LIBRARY:tclLibrary, TK_LIBRARY:tkLibrary };
		
		//console.log('PATH environment variable:', this.newEnv);
		
		console.log('Plugin Inited:', this.pluginName);
		
		this.runInstance = null;
		
		this.addDir();

	},
	//执行安装
	install:async function(){
		

		console.log('PATH environment variable:', this.newEnv);
		
		const options = {
			cwd: this.pluginPath,
			env: this.newEnv
		};
		
		// 安装virtualenv
		zn.pluginLog('正在安装 virtualenv');
		await zn.execute('cmd.exe', ['/c', `python -u -m pip install --no-index --find-links=.\\packages virtualenv`], options);

		// 初始化虚拟环境
		zn.pluginLog('初始化虚拟环境');
		await zn.execute('cmd.exe', ['/c', `python -u -m virtualenv venv`], options);


		// 安装依赖包
		zn.pluginLog('安装依赖包...');
		
		try {

			await zn.execute('cmd.exe', ['/c', `venv\\Scripts\\python.exe -u -m pip install --no-index --find-links=.\\packages -r .\\requirements.txt`], options);
			
			// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
			await zn.markPluginInstalled(this.pluginName);
			
			this.addDir();

		} catch (error) {
			
			zn.showLoading(false);
			console.error(`Error executing command: ${error.message}`);
		}

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
		
		zn.showLoading(true, "正在启动，请耐心等候！", 3000);
		
		const options = {
			cwd: this.pluginPath,
			env: this.newEnv
		};
		
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
		
		
		try {
			await zn.execute('cmd.exe', ['/c', "venv\\Scripts\\python.exe -u Rope.py "], options, callback);
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
	
	//是否正在运行
	isRunning:async function(){
		return this.runInstance != null;
	},
	
	//添加目录
	addDir:async function(){
		let isInstalled = await zn.isPluginInstalled(this.pluginName);
		if(isInstalled){
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"Rope根目录", viewPath:`\\Products\\${this.pluginName}`, dirPath:`\\Products\\${this.pluginName}`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型目录", viewPath:`\\Products\\${this.pluginName}\\models`, dirPath:`\\Products\\${this.pluginName}\\\\models`});
		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	}
	
}