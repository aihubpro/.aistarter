{
	//执行初始化
	init:async function(){
		console.log('Plugin Inited:', this.pluginName);
		
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		this._oldEnvPath = process.env.PATH; //记录原来的环境变量
		
		this.runInstance = null;
		
		await this._initEnv();

	},
	
	//设置环境
	_initEnv:async function(){
		
		let rootPath = await zn.getSettingValue('rootDir', 'ComfyUI_Aki_1_3');
		if(rootPath && rootPath != ""){
			let envPath = this._oldEnvPath;
			//追加python 环境
			envPath = `${rootPath}\\python;` + envPath;
			envPath = `${rootPath}\\python\\Scripts;` + envPath;
			
			//追加GIT 环境变量
			envPath = `${rootPath}\\git\\cmd;` + envPath;

			
			//hugginface cache
			let hugginfaceCache = `${rootPath}\\.cache`;
			

			//临时的环境变量
			this.newEnv = { PATH: envPath, HF_HOME:hugginfaceCache };
			
			//console.log('PATH environment variable:', this.newEnv);
			
			this.addDir();
		}
		
	},
	
	//执行安装
	install:async function(){
		
		// 标记安装成功, 没有啥处理的了直接标记安装成功
		await zn.markPluginInstalled(this.pluginName);

	},
	
	//执行下载
	download:async function(){
		console.log("plugin download!!");
		await zn.downloadProjectTorrent(this.pluginName);
		
		await zn.setSettingValue('rootDir', `${this.pluginPath}\\ComfyUI-aki-v1.3`, 'ComfyUI_Aki_1_3');
		
		await zn.markPluginInstalled(this.pluginName);
		
		await this._initEnv();
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
		
		let runMode = await zn.getSettingValue('RunMode', "ComfyUI_Aki_1_3");
		
		let useCpu = "";
		if(runMode != "gpu"){
			useCpu = " --cpu"
		}
		
		zn.showLoading(true, "正在启动，启动时间比较长请耐心等候！");
		
		let rootPath = await zn.getSettingValue('rootDir', 'ComfyUI_Aki_1_3');
		
		if(!rootPath || rootPath == ""){
			zn.showMessage("请在设置选项中配置绘世版ComfyUI的根目录！");
			zn.showLoading(false);
			// 按钮改回启动状态
			zn.changeBtnState(this.pluginName, 'run');
			return;
		}
		
		const options = {
			cwd: rootPath,
			env: this.newEnv
		};
		
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
		
		
		try {
			await zn.execute('cmd.exe', ['/c', `.\\python\\python.exe -u -s main.py${useCpu} --windows-standalone-build`], options, callback);
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
		let rootPath = await zn.getSettingValue('rootDir', 'ComfyUI_Aki_1_3');
		if(isInstalled && rootPath != ""){
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"ComfyUI根目录", viewPath:`.\\`, dirPath:`${rootPath}`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型", viewPath:`.\\models`, dirPath:`${rootPath}\\models`});
		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
		if(settingClass == "ComfyUI_Aki_1_3" && settingValue){
			if(settingKey == "rootDir" && settingValue != ""){
				await this._initEnv();
				// 设置了路径就标记已下载
				zn.markPluginDownloaded(this.pluginName);
			}
			zn.showMessage("设置成功，重启WebUI生效！");
		}
		
	},

	//设置菜单
	addSetting:async function(){
		const settings = {className:"ComfyUI_Aki_1_3", title:"ComfyUI绘世版设置", configList:[
		  {
			key: 'rootDir',
			label: '绘世目录',
			desc:'绘世ComfyUI软件的根目录',
			type: 'dir',
			default: ""
		  },
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
	}
}