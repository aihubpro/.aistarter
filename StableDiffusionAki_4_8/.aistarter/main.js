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
		
		let rootPath = await zn.getSettingValue('rootDir', 'StableDiffusionAki_4_8');
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
		
		await zn.setSettingValue('rootDir', `${this.pluginPath}\\sd-webui-aki-v4.6.1`, 'StableDiffusionAki_4_8');
		
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
		
		
		let gupinfo = await zn.getGupInfo();
			
		let fastGup = await zn.getSettingValue('fastGup', 'StableDiffusionAki_4_8');
		let fastGupCmd = '';
		if(fastGup){
			fastGupCmd = ' && set SAFETENSORS_FAST_GPU=1';
		}
		
		let openApi = await zn.getSettingValue('openApi', 'StableDiffusionAki_4_8');
		let openApiCmd = '';
		if(openApi){
			openApiCmd = ' --api';
		}

		zn.showLoading(true, "正在启动，启动时间比较长请耐心等候！");
		
		let curRam = 0;
		if(gupinfo && gupinfo["AdapterRAM"]){
			curRam = Math.round(Number(gupinfo["AdapterRAM"]) / Math.pow(1024, 3));
		}
		console.log(curRam);
		let commondStr = '';
		
		if(curRam <= 3 || (gupinfo && gupinfo["Caption"].includes("AMD"))){
			commondStr = `set COMMANDLINE_ARGS=--theme dark --use-cpu all --skip-torch-cuda-test --precision full --no-half --no-half-vae${openApiCmd} --autolaunch && .\\python\\python.exe -u webui.py`;
		}else if(curRam <= 4){
			commondStr = `set COMMANDLINE_ARGS=--theme dark --xformers --precision full --no-half --no-half-vae --opt-split-attention --opt-sub-quad-attention --disable-nan-check --lowvram${openApiCmd} --autolaunch${fastGupCmd} && .\\python\\python.exe -u webui.py`;
		}else if(curRam <= 6){
			commondStr = `set COMMANDLINE_ARGS=--theme dark --xformers --precision full --no-half --no-half-vae --opt-split-attention --opt-sub-quad-attention --disable-nan-check --medvram${openApiCmd} --autolaunch${fastGupCmd} && .\\python\\python.exe -u webui.py`;
		}else{
			commondStr = `set COMMANDLINE_ARGS=--theme dark --xformers --precision full --no-half --no-half-vae --opt-split-attention --opt-sub-quad-attention --disable-nan-check${openApiCmd} --autolaunch${fastGupCmd} && .\\python\\python.exe -u webui.py`;
		}
		
		console.log(commondStr);
		
		let rootPath = await zn.getSettingValue('rootDir', 'StableDiffusionAki_4_8');
		
		if(!rootPath || rootPath == ""){
			zn.showMessage("请在设置选项中配置绘世版StableDiffusion的根目录！");
			zn.showLoading(false);
			// 按钮改回启动状态
			zn.changeBtnState(this.pluginName, 'run');
			return;
		}
		
		const options = {
			cwd: rootPath,
			env: this.newEnv
		};
		
		// console.log(this.newEnv);
		
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
		
		zn.execute('cmd.exe', ['/c', commondStr], options, callback)
		
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
		let rootPath = await zn.getSettingValue('rootDir', 'StableDiffusionAki_4_8');
		if(isInstalled && rootPath != ""){
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"SD根目录", viewPath:`.\\`, dirPath:`${rootPath}`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"插件", viewPath:`.\\extensions`, dirPath:`${rootPath}\\extensions`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型", viewPath:`.\\models`, dirPath:`${rootPath}\\models`});
		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
		if(settingClass == "StableDiffusionAki_4_8" && settingValue){
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
		const settings = {className:"StableDiffusionAki_4_8", title:"StableDiffusion绘世版设置", configList:[
		  {
			key: 'rootDir',
			label: '绘世目录',
			desc:'绘世StableDiffusion软件的根目录',
			type: 'dir',
			default: ""
		  },
		  {
			key: 'fastGup',
			label: '启动快速GPU',
			type: 'switch',
			default: false
		  },
		  {
			key: 'openApi',
			label: '启用API',
			desc:'供其它软件调用Stable Diffusion WebUI的接口',
			type: 'switch',
			default: false
		  }
		
		]};
		
		return settings;
	}
}