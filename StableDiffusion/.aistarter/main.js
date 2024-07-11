{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		let envPath = process.env.PATH;
		//追加python 环境
		envPath = `${pluginPath}\\Third\\python-3.10.6;` + envPath;
		envPath = `${pluginPath}\\Third\\python-3.10.6\\Scripts;` + envPath;
		
		//追加GIT 环境变量
		envPath = `${pluginPath}\\Third\\git-2.43.0\\cmd;` + envPath;

		
		let tclLibrary = `${pluginPath}\\Third\\python-3.10.6\\tcl\\tcl8.6`;
		let tkLibrary = `${pluginPath}\\Third\\python-3.10.6\\tcl\\tk8.6`;
		
		//hugginface cache
		let hugginfaceCache = `${pluginPath}\\.cache`;
		

		//临时的环境变量
		this.newEnv = { PATH: envPath, TCL_LIBRARY:tclLibrary, TK_LIBRARY:tkLibrary, HF_HOME:hugginfaceCache };
		
		//console.log('PATH environment variable:', this.newEnv);
		
		console.log('Plugin Inited:', this.pluginName);
		
		this.addDir();
		
		this.runInstance = null;

	},
	//执行安装
	install:async function(){
		
		let pluginPath = this.pluginPath; //AI软件所在路径
		let pluginNmae = this.pluginName; //AI软件目录名
		let newEnv = this.newEnv;
		console.log('PATH environment variable:', newEnv);
		
		const options = {
			cwd: this.pluginPath + '\\stable-diffusion-webui',
			env: this.newEnv
		};
			
		let gupinfo = await zn.getGupInfo();
		if(gupinfo && gupinfo["Caption"]){
			if(gupinfo["Caption"].includes("NVIDIA")){
				console.log("NVIDIA");
				//NVIDIA 卡
				try {
					let nvidiaSimStr = await zn.getNvidiaSmi();
					console.log(nvidiaSimStr);
					if(nvidiaSimStr.includes("CUDA Version")){
						// 安装virtualenv
						zn.pluginLog('正在安装 virtualenv');
					}else{
						zn.showMessage("检测不到NVIDIA驱动，运行可能失败！");
					}
				} catch (error) {
					// 处理错误情况
					zn.showMessage("检测不到NVIDIA驱动，运行可能失败！");
				}
										
				await zn.execute('cmd.exe', ['/c', `python -u -m pip install --no-index --find-links=".\\packages" virtualenv`], options);
		
				// 初始化虚拟环境
				zn.pluginLog('初始化虚拟环境');
				await zn.execute('cmd.exe', ['/c', `python -u -m virtualenv venv`], options);
				
				// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
				await zn.markPluginInstalled(pluginNmae);
				this.addDir();
				zn.showLoading(false);
						
			}else if(gupinfo["Caption"].includes("AMD")){
				console.log("AMD");
				//AMD卡
				// 安装virtualenv
				zn.pluginLog('正在安装 virtualenv');
				await zn.execute('cmd.exe', ['/c', `python -u -m pip install --no-index --find-links=".\\packages" virtualenv`], options);

				// 初始化虚拟环境
				zn.pluginLog('初始化虚拟环境');
				await zn.execute('cmd.exe', ['/c', `python -u -m virtualenv venv`], options);
				
				// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
				await zn.markPluginInstalled(pluginNmae);
				this.addDir();
			}else{
				//其他不知名的
				console.log("Unknow GPU");
				// 安装virtualenv
				zn.pluginLog('正在安装 virtualenv');
				await zn.execute('cmd.exe', ['/c', `python -u -m pip install --no-index --find-links=".\\packages" virtualenv`], options);
				
				// 初始化虚拟环境
				zn.pluginLog('初始化虚拟环境');
				await zn.execute('cmd.exe', ['/c', `python -u -m virtualenv venv`], options);
				
				// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
				await zn.markPluginInstalled(pluginNmae);
				this.addDir();
			}

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
		
		
		let gupinfo = await zn.getGupInfo();
			
		let fastGup = await zn.getSettingValue('fastGup', 'StableDiffusion');
		let fastGupCmd = '';
		if(fastGup){
			fastGupCmd = ' && set SAFETENSORS_FAST_GPU=1';
		}
		
		let openApi = await zn.getSettingValue('openApi', 'StableDiffusion');
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
			commondStr = `call venv\\Scripts\\activate.bat && set COMMANDLINE_ARGS=--use-cpu all --skip-torch-cuda-test --precision full --no-half --no-half-vae${openApiCmd} --autolaunch && venv\\Scripts\\python.exe -u webui.py`;
		}else if(curRam <= 4){
			commondStr = `call venv\\Scripts\\activate.bat && set COMMANDLINE_ARGS=--precision full --no-half --no-half-vae --opt-split-attention --opt-sub-quad-attention --disable-nan-check --lowvram${openApiCmd} --autolaunch${fastGupCmd} && venv\\Scripts\\python.exe -u webui.py`;
		}else if(curRam <= 6){
			commondStr = `call venv\\Scripts\\activate.bat && set COMMANDLINE_ARGS=--precision full --no-half --no-half-vae --opt-split-attention --opt-sub-quad-attention --disable-nan-check --medvram${openApiCmd} --autolaunch${fastGupCmd} && venv\\Scripts\\python.exe -u webui.py`;
		}else{
			commondStr = `call venv\\Scripts\\activate.bat && set COMMANDLINE_ARGS=--precision full --no-half --no-half-vae --opt-split-attention --opt-sub-quad-attention --disable-nan-check${openApiCmd} --autolaunch${fastGupCmd} && venv\\Scripts\\python.exe -u webui.py`;
		}
		
		console.log(commondStr);
		
		const options = {
			cwd: this.pluginPath + '\\stable-diffusion-webui',
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
		if(isInstalled){
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"SD根目录", viewPath:`.\\stable-diffusion-webui`, dirPath:`\\Products\\${this.pluginName}\\stable-diffusion-webui`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"模型", viewPath:`.\\stable-diffusion-webui\\models`, dirPath:`\\Products\\${this.pluginName}\\stable-diffusion-webui\\models`});
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"插件", viewPath:`.\\stable-diffusion-webui\\extensions`, dirPath:`\\Products\\${this.pluginName}\\stable-diffusion-webui\\extensions`});
		}
	},
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
		if(settingClass == "StableDiffusion" && settingValue){
			zn.showMessage("设置成功，重启WebUI生效！");
		}
		
	},

	//设置菜单
	addSetting:async function(){
		const settings = {className:"StableDiffusion", title:"StableDiffusion设置", configList:[
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