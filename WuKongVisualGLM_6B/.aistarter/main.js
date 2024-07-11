{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		console.log('Plugin Inited:', this.pluginName);
		
		this.runInstance = null


	},
	
	//执行下载
	download:async function(){
		console.log("plugin download!!");
		await zn.downloadProjectTorrent(this.pluginName);
	},
	
	//执行安装
	install:async function(){

		let pluginName = this.pluginName; //AI软件目录名

		try {

			// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
			await zn.markPluginInstalled(pluginName);

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
		
		let runMode = await zn.getSettingValue('RunMode', "WuKongVisualGLM6B");
		
		let quantParam = "";
		if(runMode == '4'){
			quantParam = " --quant 4";
		}else if(runMode == '8'){
			quantParam = " --quant 8";
		}
		
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
			cwd: this.pluginPath + "\\VisualGLM-6B"
		};
		
		try {
			await zn.execute('cmd.exe', ['/c', `.\\Python310\\python.exe .\\web_demo.py${quantParam}`], options, callback)
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
	
	//设置菜单
	addSetting:async function(){
		const settings = {className:"WuKongVisualGLM6B", title:"悟空VisualGLM设置", configList:[
		  {
	        key: 'RunMode',
			label:'启动模式',
			type: 'select',
			options: [
			  { label: '8G以下显存', value: '4' },
			  { label: '8G显存', value: '8' },
			  { label: '12G以上显存', value: '0' },
			],
			default: '4'
		  }
		]};
		
		return settings;
	},	
	
	//设置值改变回调
	onSettingChange:async function(settingKey, settingValue, settingClass){
		//console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
	
	}
	
}