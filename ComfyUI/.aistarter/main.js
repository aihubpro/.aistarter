{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		console.log('Plugin Inited:', this.pluginName);

		let envPath = process.env.PATH;
		//追加python 环境
		envPath = `${this.pluginPath}\\..\\StableDiffusion\\Third\\python-3.10.6;` + envPath;
		envPath = `${this.pluginPath}\\..\\StableDiffusion\\Third\\python-3.10.6\\Scripts;` + envPath;
		
		//临时的环境变量
		this.newEnv = { PATH: envPath};
		
		this.runInstance = null

		this.addDir();

	},
	//执行安装
	install:async function(){

		let pluginNmae = this.pluginName; //AI软件目录名

		let isInstalled = await zn.isPluginInstalled("StableDiffusion");
		if(!isInstalled){
			zn.showMessage("请先安装StableDiffusion！");
			zn.showLoading(false);
		}else{
			// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
			await zn.markPluginInstalled(pluginNmae);
			
			this.addDir();
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
		
		let isInstalled = await zn.isPluginInstalled("StableDiffusion");
		if(!isInstalled){
			zn.showMessage("请先安装StableDiffusion，ComfyUI依赖项目！");
			return;
		}
		
		zn.showLoading(true, "正在启动，启动时间比较长请耐心等候！");
		
		let gupinfo = await zn.getGupInfo();
		
		let useCpu = "";
		if(!gupinfo || !gupinfo["Caption"].includes("NVIDIA")){
			useCpu = " --cpu"
		}
		
		//回调
		let callback = {
			created:(process) => {
				this.runInstance = process
			},
			stdout:(data) => {
				if(data.toString().includes("Starting")){
					zn.showLoading(false);
				}
			}
		}
		
		const options = {
			cwd: `${this.pluginPath}\\..\\StableDiffusion\\stable-diffusion-webui`,
			env: this.newEnv
		};
		
		await zn.execute('cmd.exe', ['/c', `call venv\\Scripts\\activate.bat && venv\\Scripts\\python.exe -u ${this.pluginPath}\\main.py${useCpu} --auto-launch`], options, callback);
		
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
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"ComfyUI根目录", viewPath:`\\Products\\${this.pluginName}`, dirPath:`\\Products\\${this.pluginName}`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型目录", viewPath:`..\\stable-diffusion-webui\\models`, dirPath:`\\Products\\StableDiffusion\\stable-diffusion-webui\\models`});
		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
	
}