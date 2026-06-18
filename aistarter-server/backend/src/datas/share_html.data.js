const { readConfig } = require('../helpers/storage')
let share = {}
// 获取最新软件下载链接
let download = readConfig("share_cfg");
if (!download) {
    share.downloadUrl= 'https://www.starter.top/downloads/aistarter/AIStarter%20Setup%203.3.0.exe'
}else{
    share.downloadUrl= download.shareInfo.downloadUrl;
}
share.clientName= 'aistarter' //客户端名称
share.upperName= 'AIStarter' //标题大写开头
share.bgUrl='https://aistarter.cc/' //背景地址 aistarter用 https://aistarter.cc/。其他用 /share.html
module.exports = 
`
<!DOCTYPE html>
<html lang='zh-CN'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>检查是否安装${share.upperName}</title>
    <style>
        /* 确保body和html元素没有默认边距，并且高度为100% */
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden; /* 防止滚动条出现 */
        }

        /* 设置 iframe 的样式 */
        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none; /* 去除边框 */
        }
        /* 弹窗容器 */
        .modal {
            display: none; /* 默认隐藏 */
            position: fixed;
            z-index: 1001;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5); /* 半透明黑色背景 */
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }

        /* 弹窗主体 */
        .modal-content {
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            padding: 20px;
            width: 300px;
            max-width: 90%;
            text-align: center;
            font-family: 'Arial', sans-serif;
            position: relative;
        }

        /* 标题样式 */
        .modal-title {
            font-size: 1.2em;
            margin-bottom: 10px;
            color: #2c3e50;
        }

        /* 内容样式 */
        .modal-text {
            margin-bottom: 20px;
            color: #7f8c8d;
        }

        /* 按钮样式 */
        .modal-button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #fff;
            text-align: center;
            text-decoration: none;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(45deg, #3498db, #2980b9);
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.6);
        }

        .modal-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(52, 152, 219, 0.8);
        }

        /* 关闭按钮样式 */
        .modal-close {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 20px;
            color: #aaa;
            cursor: pointer;
        }

        .modal-close:hover {
            color: #c9c9c9;
        }

        /* 显示弹窗 */
        .modal.show {
            display: flex;
        }
        /* 弹窗容器 */
        .model-open {
            display: none; /* 默认隐藏 */
            position: fixed;
            z-index: 1000;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 450px;
            height: 200px;
            max-width: 90%;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            padding: 20px;
            text-align: center;
            font-family: 'Arial', sans-serif;
        }

        .model-open.showopen{
            display: block;
        }

        /* 标题样式 */
        .model-open-title {
            font-size: 1.2em;
            color: #333;
            text-align: left;
            flex: 1;
        }

        /* 加载提示 */
        .loading-message {
            flex: 4;
            height: 80%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* 按钮样式 */
        .model-open-button {
            display: inline-block;
            padding: 5px 20px;
            font-size: 14px;
            color: #333;
            text-align: center;
            text-decoration: none;
            border: 1px solid #ccc;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0 10px;
        }

        .model-open-button.primary {
            background-color: #6c757d;
            color: #fff;
            border-color: #6c757d;
        }

        .model-open-button:hover {
            background-color: #6c757d;
            color: #fff;
        }

        /* 关闭按钮 */
        .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 20px;
            color: #aaa;
            cursor: pointer;
        }

        /* 显示弹窗 */
        .model-open.show {
            display: block;
        }
        .content{
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .buttons{
            flex: 1;
            height: 10%;
            display: flex;
            justify-content: end;
        }
    </style>
</head>
<body>
    <!-- 弹窗结构 -->
    <div id='myModal' class='modal'>
        <div class='modal-content'>
            <button class='modal-close' onclick='closeModal()'>&times;</button>
            <div class='modal-title'>下载最新版软件</div>
            <p class='modal-text'>应用程序未安装，请下载并安装${share.upperName}。</p>
            <a href='${share.downloadUrl}' class='modal-button'>立即下载</a>
        </div>
    </div>
    <!-- 弹窗结构 -->
    <div id='openmodel' class='model-open showopen'>
        <span class='close-button' onclick='closeModalOpen()'>&times;</span>
        <div class='content'>
        <div class='model-open-title'>打开客户端</div>
        <div class='loading-message'>
            <div>
            正在打开${share.upperName}客户端，请稍候...
            </div>
        </div>
        <div class='buttons'>
            <button class='model-open-button' onclick='downloadClient()'>下载客户端</button>
            <button class='model-open-button primary' onclick='startClient()'>打开客户端</button>
        </div>
        </div>
    </div>
    <iframe src='${share.bgUrl}'></iframe>
    <script>
        /**
         * 注册事件监听器，并返回一个可用于移除事件监听的对象。
         *
         * @param {Object} target - 事件监听器要添加到的目标对象。
         * @param {string} eventType - 事件类型，如 'click'、'blur' 等。
         * @param {function} cb - 事件回调函数。
         * @returns {Object} - 可用于移除事件监听的对象，具有一个 'remove' 方法。
         */
        function _registerEvent(target, eventType, cb) {
        const eventListener = target.addEventListener || target.attachEvent;
        eventListener.call(target, eventType, cb);

        return {
            remove: function () {
            const eventRemover = target.removeEventListener || target.detachEvent;
            eventRemover.call(target, eventType, cb);
            },
        };
        }

        /**
         * 在打开指定URI之前设置一个超时，以处理超时情况。
         *
         * @param {string} uri - 要打开的URI。
         * @param {function} failCb - 超时或失败时的回调函数。
         * @param {function} successCb - 成功时的回调函数。
         * @param {number} timeoutDuration - 超时时长（毫秒）。
         */
        function openUriWithTimeoutHack(uri, failCb, successCb, timeoutDuration) {
        let timeout = setTimeout(function () {
            failCb();
            handler.remove();
        }, timeoutDuration);

        let target = window;
        while (target !== target.parent) {
            target = target.parent;
        }

        let handler = _registerEvent(target, 'blur', onBlur);

        function onBlur() {
            clearTimeout(timeout);
            handler.remove();
            successCb();
        }

        window.location = uri;
        }

        // 模拟下载客户端
        function downloadClient() {
            const url = '${share.downloadUrl}';
            window.location.href = url;
        }

        // 模拟启动客户端
        function startClient() {
            openUriWithTimeoutHack(appUri, openAppFailure, openAppSuccess, timeoutDuration);
        }

        // 获取URL参数中的fid
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        // 获取fid参数
        const fid = getQueryParam('fid');
        // 获取类型参数
        const type = getQueryParam('type');

        // 获取优惠码参数
        const discountCode = getQueryParam('discountCode');

        let appUri;

        // 检查是否为优惠码链接
        if (discountCode) {
            // 处理优惠码逻辑
            appUri = '${share.clientName}://pricing/' + discountCode; // 应用程序的地址(注册表应用名称)';
            // console.log('优惠码链接:', discountCode);
        } else {
            // 处理普通链接逻辑
            if(type){
                appUri = '${share.clientName}://project/' + fid + '/' + type; // 应用程序的地址(注册表应用名称)';
                // console.log('普通链接:', fid, type);
            }else{
                appUri = '${share.clientName}://project/' + fid; // 应用程序的地址(注册表应用名称)';
                // console.log('普通链接:', fid, type);
            }
            // console.log('普通链接:', fid, type);
        }
        
        const timeoutDuration = 1000;

        const openAppFailure = () => {
            // const url = '${share.downloadUrl}';
            // const res = confirm('应用程序未安装，请下载并安装${share.upperName}。');
            // if (res) {
            //     window.location.href = url; // window.open会被浏览器拦截,使用window.location.href下载exe
            // }
            document.getElementById('myModal').classList.add('show');
        };

        const openAppSuccess = () => {
            console.log('成功打开本地应用程序');
        };

        openUriWithTimeoutHack(appUri, openAppFailure, openAppSuccess, timeoutDuration);

        // 关闭按钮
        function closeModal() {
            document.getElementById('myModal').classList.remove('show');
        }

        // 关闭弹窗
        function closeModalOpen() {
            document.getElementById('openmodel').classList.remove('showopen');
        }

    </script>
</body>
</html>
`