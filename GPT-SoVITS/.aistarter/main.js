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
		
		//回调
		let callback = {
			created:(process) => {
				this.runInstance = process
			},
			stdout:(data) => {
				let stdoutStr = data.toString();
				if(stdoutStr.includes("Running")){
					zn.showLoading(false);
				}
			}
		}
		
		const options = {
			cwd: this.pluginPath
		};
		
		try {
			await zn.execute('cmd.exe', ['/c', `runtime\\python.exe -u webui.py`], options, callback);
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
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"GPT-SoVITS目录", viewPath:`.\\${this.pluginName}`, dirPath:`\\Products\\${this.pluginName}`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"输出总目录", viewPath:`.\\${this.pluginName}\\output`, dirPath:`\\Products\\${this.pluginName}\\output`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"语音切分输出目录", viewPath:`..\\output\\slicer_opt`, dirPath:`\\Products\\${this.pluginName}\\output\\slicer_opt`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"ASR进程输出信息", viewPath:`..\\output\\asr_opt`, dirPath:`\\Products\\${this.pluginName}\\output\\asr_opt`});
			
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"UVR5输出目录", viewPath:`..\\output\\uvr5_opt`, dirPath:`\\Products\\${this.pluginName}\\output\\uvr5_opt`});

		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
}