{
	//执行初始化
	init:async function(){
		let pluginPath = this.pluginPath; //AI软件所在目录
		
		console.log('Plugin Inited:', this.pluginName); //插件初始化
		
		this.runInstance = null //运行实例

		this.addDir(); //添加目录
	},
	
	//执行下载
	download:async function(){
		console.log("plugin download!!"); //下载种子
		await zn.downloadProjectTorrent(this.pluginName); //下载种子
	},
	
	//执行安装
	install:async function(){

		let pluginName = this.pluginName; //AI软件目录名

		try {

			// 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
			await zn.markPluginInstalled(pluginName); //标记安装成功

			this.addDir(); //添加目录

		} catch (error) {
			console.error('Error executing command:'+error.message);
		}

	},
	
	//运行
	run:async function(){
		if(this.runInstance){
			console.log(this.runInstance.pid) //打印进程id
        	zn.killProcessTree(this.runInstance.pid); //结束进程
        	this.runInstance = null //重置进程
        	return;
		}
		
		zn.showLoading(true,"正在启动，请耐心等候！",<%= startTime %>);
		//这里是读取设置选项，运行模式自己定义的
		// let runMode = await zn.getSettingValue('RunMode', this.pluginName); //RunMode 对应设置菜单，详情请看设置菜单
		
		// let useCpu = "";
		// if(runMode != "gpu"){
		// 	//这里就是不是GPU的时候useCpu字符串加上了--cpu，GPU的时候是空的
		// 	useCpu = " --cpu"
		// }
		
		//回调
		let callback = {
			created:(process) => {
				this.runInstance = process //保存进程实例
			},
			stdout:(data) => { //标准输出  可改 stderr 错误输出
                <% if(endJudgment) {%>
				if(data.toString().includes("<%= endJudgment%>")){ //结束判断
					zn.showLoading(false); //关闭loading
					// zn.execute('cmd.exe',['/c','start 127.0.0.1:8999']) //打开浏览器
				}
				<% } else { %>
				/**
				 *if(data.toString().includes("Starting")){ //这里就是判断是否启动成功，启动成功就关闭loading
				 *	zn.showLoading(false); //关闭loading
				 *	// zn.execute('cmd.exe',['/c','start 127.0.0.1:8999']) // 项目没有自动跳转，可以手动跳转
				 *}
				 */
				<% } %>
			},
			stderr:(data) => { //错误输出  可改 stdout 标准输出
                <% if(endJudgment) {%>
				if(data.toString().includes("<%= endJudgment%>")){ //结束判断
					zn.showLoading(false); //关闭loading
					// zn.execute('cmd.exe',['/c','start 127.0.0.1:8999']) //打开浏览器
				}
				<% } else { %>
				/**
				 *if(data.toString().includes("Starting")){ //这里就是判断是否启动成功，启动成功就关闭loading
				 *	zn.showLoading(false); //关闭loading
				 *	// zn.execute('cmd.exe',['/c','start 127.0.0.1:8999']) // 项目没有自动跳转，可以手动跳转
				 *}
				 */
				<% } %>
			}
		}
		
		const options = {
			cwd: `${this.pluginPath}\\<%= cmdExecuteDirectory %>`, //cwd是命令执行的目录，例如cmd执行命令的时候，要先用cd指定到目录执行
			env: {
				PYTHONIOENCODING: "utf-8", //避免中文乱码
				LANG: "C.UTF-8", //避免中文乱码
				LC_ALL: "C.UTF-8" //避免中文乱码
			}
		};
		/** 
         * 需要使用变动的命令 如下例子：
         * let runMode = await zn.getSettingValue('RunMode', this.pluginName);
         * let useCpu = ''
         * if (runMode == 'cpu') {
         *     useCpu = 'cpu'
         * }else if (runMode == 'gpu') {
         *     useCpu = 'gpu'
         * }
         * await zn.execute('cmd.exe', ['/c', `python -u app.py ${useCpu}`], options, callback) //这样就可以设置选择启动时运行的是cpu 还是 gpu。 python -u app.py cpu 或者 python -u app.py gpu 执行命令的时候
         */
		
		try{
			await zn.execute('cmd.exe', ['/c', "<%= executeCmdFunction %>"], options, callback) //执行命令 提示：如果需要设置环境变量，请使用set HOME=..\\aaa\\bbb&.\\run.exe 如果需要变动的值例如 ${useCpu} 这种则需要配合设置菜单使用例如 let useCpu = '' 当设置菜单的值是 cpu 时 useCpu = 'cpu' 当设置菜单的值是 gpu 时 useCpu = 'gpu' 这样就可以设置选择启动时运行的是cpu 还是 gpu
		}catch(error){
			console.error(error.message);
        	if (this.runInstance) {
        		zn.showMessage("启动失败请查看终端日志！"); //弹出提示
        		zn.changeBtnState(this.pluginName, "run"); //改变按钮状态
        		this.runInstance = null; //重置进程
        	}

		}
		
		zn.showLoading(false); //关闭loading
	},

	//点击退出
	exit:async function(){
		if(this.runInstance){
			zn.killProcessTree(this.runInstance.pid); //关闭进程
			this.runInstance = null //退出时关闭进程
		}
	},
	
	//软件退出时调用
	onAppExit:async function(){
		this.exit(); //退出时关闭进程
	},
	
	//是否正在运行
	isRunning:async function(){
		return this.runInstance != null; //返回是否正在运行
	},

	//添加目录
	addDir:async function(){
		<% if (catalogMenu.length > 0) { %>
		let isInstalled = await zn.isPluginInstalled(this.pluginName); //判断插件是否已安装
		// 如果插件已安装
		if(isInstalled){
		//软件安装后才显示目录
			<% for (let i = 0; i < catalogMenu.length; i++) { %>
			zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:"<%= catalogMenu[i].name%>", viewPath:`..<%= catalogMenu[i].path%>`, dirPath:`\\Products\\${this.pluginName}<%= catalogMenu[i].path%>`});
			<% } %>
		}
		<% } else { %>
		// // 判断插件是否已安装
		// let isInstalled = await zn.isPluginInstalled(this.pluginName); //判断插件是否已安装
		// // 如果插件已安装
		// if (isInstalled) {
		//     // 添加根目录
		//     zn.addDirToClass(this.pluginName, { icon: "Folder", viewName: "根目录", viewPath: '..\\', dirPath: "\\Products\\${this.pluginName}\\{实际目录输入到这里}" }); 
		//     // 添加模型目录
		//     zn.addDirToClass(this.pluginName, { icon: "Folder", viewName: "模型目录", viewPath: '..\\models', dirPath: "\\Products\\${this.pluginName}\\{实际目录输入到这里}" });
		//     // 添加输出目录
		//     zn.addDirToClass(this.pluginName, { icon: "Folder", viewName: "输出目录", viewPath: '..\\outputs', dirPath: "\\Products\\${this.pluginName}\\{实际目录输入到这里}" });
		// }
		<% } %>
	},

	//设置菜单
	// addSetting:async function(){
    //     /**
    //      * className 设置选项所属的类名
    //      * title 设置的标题
    //      * configList 配置的列表（json对象数组）
    //      *  key 配置选项的键值
    //      *  label 设置标题
    //      *  desc 设置的详细描述（可选）
    //      *  type 设置的类型，支持（switch:开关、dir:目录选择、 select:下拉菜单,btn:按钮）
    //      *  default 默认值，没有设置时的初始值
    //      */
    //     // 定义一个settings对象，包含className、title和configList属性
    //     const settings = {className:this.pluginName, title:`${this.pluginName}设置`, configList:[
    //     { //下拉框
    //         // 定义一个configList数组，包含key、label、type、options和default属性
    //         key: 'RunMode', //下拉框key
    //         icon:"Plus", //按钮图标
    //         label:'启动模式', //标题
    //         type: 'select',
    //         // 定义一个options数组，包含label和value属性
    //         options: [
    //         { label: '原版', value: 1 },
    //         { label: '漫画风格', value: 2 },
    //         { label: '照片风格', value: 3 }
    //         ],
    //         // 定义默认值为1
    //         default: 1
    //     },
	//	   { //按钮
	//		   key:'newbutton', //按钮key
	//		   type: 'button', //新增按钮类型
	//		   label:'启动模式', //标题
	//		   desc:'启动模式', //描述
	//		   btn_icon:"Plus", //按钮图标
	//		   btn_text:'启动', //按钮文本
	//		   btn_style:"success", //(可选) 按钮状态，支持success、danger、warning、info、primary 默认//success
	//		   btn_disabled:false, //(可选) 按钮是否禁用 默认false
	//		   bind:"onRunBtnClicked" //按钮点击回调方法名，名称由脚本功能自行定义
	//	   },
    //     { //导入目录
    //         key: 'rootDir', //目录key
    //         icon:"Folder", //图标
    //         label: '绘世目录', //标题
    //         desc:'绘世ComfyUI软件的根目录',  //描述
    //         type: 'dir', //类型
    //         default: "" //默认值
    //     },
    //     { //开关
    //         key:'swich', //开关key
    //         icon:"Plus", //图标
    //         label:'启动模式', //标题
    //         desc:'启动模式', //描述
    //         type: 'switch', //类型
    //         default: true, //默认值
    //         value:true //默认值
    //     },
    //     ]};
    //     // 返回settings对象
    //     return settings;
    // },

	//设置值改变回调
	// onSettingChange:async function(settingKey, settingValue, settingClass){
        /**
         * settingKey 设置选项的键值
         * settingValue 设置选项的值
         * settingClass 配置所属的类别
         */
        // console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
		// if(settingClass == "ComfyUI_Aki_1_3" && settingValue){
		//     if(settingKey == "rootDir" && settingValue != ""){
		//         await this._initEnv();
		//         // 设置了路径就标记已下载
		//         zn.markPluginDownloaded(this.pluginName);
		//     }
		//     zn.showMessage("设置成功，重启WebUI生效！");
		// }
    // },

	// //点击运行按钮回调
	// onRunBtnClicked:async function(){
	// 	//TODO 这里运行对应的逻辑
	// 	if(this.runbutton){ //判断是否已经启动
	// 		if(this.runbutton.pid){ //判断是否已经启动
	// 			zn.killProcessTree(this.runbutton.pid); //关闭进程
	// 			this.runbutton = null //重置进程
	// 			zn.updateSetting(this.pluginName,'newbutton',{btn_text:'启动',btn_style:'success'}) //更新按钮文本
	// 			return;
	// 		}
	// 	}
		
	// 	zn.showLoading(true, "正在启动，请耐心等候！"); //显示加载中
	// 	let callback = {
	// 		created:(process) => {
    //          zn.updateSetting(this.pluginName,'newbutton',{btn_text:'关闭',btn_style:'danger'}) //修改按钮状态
	// 			this.runbutton = process //保存进程
	// 		},
	// 		stdout: (data) => {
	// 			if (data.toString().includes('runexit')) { //结束判断
	// 				zn.showLoading(false); //关闭加载中
	// 			}
	// 		}
	// 	}
		
	// 	const Options = {
	// 		cwd: this.pluginPath, //设置工作目录
	// 	};
		
	// 	try {
	// 		await zn.execute('cmd.exe', ['/c','start http://baidu.com'], Options, callback) //启动进程
	// 	} catch (error) {
	// 		console.error(error.message);
	// 		if(this.runbutton){ //判断是否已经启动
	// 			zn.showMessage("启动失败请查看终端日志！");
	// 			zn.updateSetting(this.pluginName,'newbutton',{btn_text:'启动',btn_style:'success'}) //更新按钮文本
	// 			this.runbutton = null;
	// 		}

	// 	}
		
	// 	zn.showLoading(false); //关闭加载中
	// }
}