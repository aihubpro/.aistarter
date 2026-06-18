let projectScrData = {
    //必要信息
    //执行初始化
    init:`async function(){
        let pluginPath = this.pluginPath; //AI软件所在目录
        console.log('Plugin Inited:', this.pluginName);
        this.runInstance = null
        this.addDir();
    }`,
    //执行安装
    install:`async function(){
        let pluginNmae = this.pluginName; //AI软件目录名

        try {

            // 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
            await zn.markPluginInstalled(pluginNmae);

            this.addDir();

        } catch (error) {
            console.error('Error executing command:'+error.message);
        }
    }`,
    //执行下载
    download:`async function(){
        console.log("plugin download!!");
        await zn.downloadProjectTorrent(this.pluginName);
    }`,
    //运行
    run:`async function(){
        // if (this.runInstance) {
        // 	console.log(this.runInstance.pid)
        // 	//this.runInstance.stdin.write("stop")
        // 	//this.runInstance.stdin.end();

        // 	zn.killProcessTree(this.runInstance.pid);

        // 	//this.runInstance.kill('SIGKILL');

        // 	this.runInstance = null
        // 	return;
        // }

        // zn.showLoading(true, "正在启动，请耐心等候！");

        // //回调
        // let callback = {
        // 	created: (process) => {
        // 		this.runInstance = process
        // 	},
        // 	stdout: (data) => {
        // 		if (data.toString().includes("Running")) {
        // 			zn.showLoading(false);
        // 		}
        // 	}
        // }

        // const options = {
        // 	cwd: this.pluginPath
        // };

        // let runMode = await zn.getSettingValue('RunMode', "Fooocus_2_1_864");

        // let cmdStr = "";

        // if (runMode == 2) {
        // 	cmdStr = '.\\python_embeded\\python.exe -u -s Fooocus\\entry_with_update.py --preset anime --language zh';
        // } else if (runMode == 3) {
        // 	cmdStr = '.\\python_embeded\\python.exe -u -s Fooocus\\entry_with_update.py --preset realistic --language zh';
        // } else {
        // 	cmdStr = '.\\python_embeded\\python.exe -u -s Fooocus\\entry_with_update.py --language zh';
        // }

        // try {
        // 	await zn.execute('cmd.exe', ['/c', cmdStr], options, callback)
        // } catch (error) {
        // 	console.error(error.message);
        // 	if (this.runInstance) {
        // 		zn.showMessage("启动失败请查看终端日志！");
        // 		zn.changeBtnState(this.pluginName, "run");
        // 		this.runInstance = null;
        // 	}

        // }

        // zn.showLoading(false);

    }`,
    //点击退出
    exit:`async function(){
        // 如果this.runInstance存在
        if (this.runInstance) {
            // 获取this.runInstance的pid
            let pid = this.runInstance.pid;
            // 将this.runInstance置为null
            this.runInstance = null
            // 调用zn.killProcessTree方法，传入pid
            zn.killProcessTree(pid);
        }
    }`,
    //是否正在运行
    isRunning:`async function(){
        return this.runInstance != null;
    }`,
    //非必要信息
    //软件退出时调用
    onAppExit:`async function(){
        // this.exit();
    }`,
    //添加目录
    addDir:`async function(){
        // // 判断插件是否已安装
        // let isInstalled = await zn.isPluginInstalled(this.pluginName);
        // // 如果插件已安装
        // if (isInstalled) {
        // 	// 添加主程序目录
        // 	zn.addDirToClass(this.pluginName, { icon: "Folder", viewName: "主程序目录", viewPath: '.\\\\Fooocus', dirPath: '\\Products\\\\Fooocus' });
        // 	// 添加模型目录
        // 	zn.addDirToClass(this.pluginName, { icon: "Folder", viewName: "模型目录", viewPath: '..\\Fooocus\\models', dirPath: '.\\\\Fooocus\\models' });
        // 	// 添加输出目录
        // 	zn.addDirToClass(this.pluginName, { icon: "Folder", viewName: "输出目录", viewPath: '..\\Fooocus\\outputs', dirPath: '.\\\\Fooocus\\\\outputs' });
        // }
    }`,
    //设置菜单
    addSetting:`async function(){
        /**
         * className 设置选项所属的类名
         * title 设置的标题
         * configList 配置的列表（json对象数组）
         *  key 配置选项的键值
         *  label 设置标题
         *  desc 设置的详细描述（可选）
         *  type 设置的类型，支持（switch:开关、dir:目录选择、 select:下拉菜单,button:按钮）
         *  default 默认值，没有设置时的初始值
         */
        // // 定义一个settings对象，包含className、title和configList属性
        // const settings = {className:"Fooocus_2_1_864", title:"Fooocus 2.1.864设置", configList:[
        // {
        //     // 定义一个configList数组，包含key、label、type、options和default属性
        //     key: 'RunMode',
        //     label:'启动模式',
        //     type: 'select',
        //     // 定义一个options数组，包含label和value属性
        //     options: [
        //     { label: '原版', value: 1 },
        //     { label: '漫画风格', value: 2 },
        //     { label: '照片风格', value: 3 }
        //     ],
        //     // 定义默认值为1
        //     default: 1
        // }
        // ]};
        // // 返回settings对象
        // return settings;
    }`,
    //设置值改变回调
    onSettingChange:`async function(settingKey, settingValue, settingClass){
        /**
         * settingKey 设置选项的键值
         * settingValue 设置选项的值
         * settingClass 配置所属的类别
         */
        //console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
    }`,
    //简单模式的脚本
    easy:{
        //执行初始化
        init:`async function(){
            let pluginPath = this.pluginPath; //AI软件所在目录
            
            console.log('Plugin Inited:', this.pluginName);
            
            this.runInstance = null

            this.addDir();
        }`,
        //执行下载
        download:`async function(){
            console.log("plugin download!!");
            await zn.downloadProjectTorrent(this.pluginName);
        }`,
        
        //执行安装
        install:`async function(){

            let pluginNmae = this.pluginName; //AI软件目录名

            try {

                // 标记安装成功（安装完成都要标记它，用于判断是否安装成功）
                await zn.markPluginInstalled(pluginNmae);

                this.addDir();

            } catch (error) {
                console.error('Error executing command:'+error.message);
            }

        }`,
        
        //运行
        run:`async function(){
            if(this.runInstance){
                console.log(this.runInstance.pid)
                //this.runInstance.stdin.write("stop")
                //this.runInstance.stdin.end();
                
                zn.killProcessTree(this.runInstance.pid);
                
                //this.runInstance.kill('SIGKILL');
                
                this.runInstance = null
                return;
            }
            
            zn.showLoading(true, this.loadingTips,this.startTime);

            //这里是读取设置选项，运行模式自己定义的
            // let runMode = await zn.getSettingValue('RunMode', this.pluginName);
            
            // let useCpu = "";
            // if(runMode != "gpu"){
            // 	//这里就是不是GPU的时候useCpu字符串加上了--cpu，GPU的时候是空的
            // 	useCpu = " --cpu"
            // }
            
            //回调
            let callback = {
                created:(process) => {
                    this.runInstance = process
                },
                stdout:(data) => {
                    if(data.toString().includes(this.endJudgment)){
                        zn.showLoading(false);
                        if(this.nonAutoJump){
                            zn.execute('cmd.exe',['/c','start '+this.nonAutoJump])
                        }
                    }
                }
            }
            
            const options = {
                cwd: this.pluginPath + "\\\\" + this.cmdExecuteDirectory
            };
            
            try{
                await zn.execute('cmd.exe', ['/c', this.executeCmdFunction], options, callback)
            }catch(e){
                console.log(e)
            }
            
            
            zn.showLoading(false);
        }`,
        
        //点击退出
        exit:`async function(){
            if(this.runInstance){
                zn.killProcessTree(this.runInstance.pid);
                this.runInstance = null
            }
        }`,
        
        //软件退出时调用
        onAppExit:`async function(){
            this.exit();
        }`,
        
        //是否正在运行
        isRunning:`async function(){
            return this.runInstance != null;
        }`,
        //添加目录
        addDir:`async function(){
            if(this.catalogMenu.length>0){
                let isInstalled = await zn.isPluginInstalled(this.pluginName);
                if(isInstalled){
                    this.catalogMenu.forEach(item => {
                        zn.addDirToClass(this.pluginName, {icon:"Folder", viewName:item.name, viewPath:'..'+item.path, dirPath:'\\\\Products\\\\'+this.pluginName+item.path});
                    });
                }
            }
        }`,
        //设置菜单
        addSetting: `async function() {
            const settings = {
                className: this.pluginName, title: this.pluginName + "设置", configList: this.settingsMenu
            };
            if(this.settingsMenu.length==0){
                return { className: this.pluginName, title: "", configList: this.settingsMenu }
            }
            return settings;
        }`,
        
        //设置值改变回调
        onSettingChange:`async function(settingKey, settingValue, settingClass){
            //console.log("onSettingChange::" + settingKey + "_" + settingValue + "_" + settingClass);
            //let runMode = await zn.getSettingValue(settingKey, this.pluginName);
            //console.log(runMode)
        }`
    }
}

module.exports = {
    projectScrData
}