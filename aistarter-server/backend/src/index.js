const express = require('express')
const morgan = require('morgan')
const cors = require('cors');
// 引入express-fileuplod
const fileUpload = require('express-fileupload');
const http = require('http');

const { initScheduler } = require('./scheduler');
const {ChatServer,DbChatServer} = require('./websocket/chatServer');

initScheduler();

// const bodyParser = require('body-parser')

const config = require("./config")
const app = express()

app.set('port', config.PROT || 7000)

const corsOptions = {
  // origin: 'http://example.com', // 允许指定域名进行跨域访问
  // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 允许的HTTP请求方法
  // allowedHeaders: 'Content-Type,Authorization', // 允许的请求头字段
  // credentials: true, // 是否允许带上Cookie信息
  // optionsSuccessStatus: 200 // 预检请求成功的HTTP状态码
};

//解决支付宝通知参数是空问题
app.use(function (req, res, next){
  if (req.url === '/pay/alipayPayNotify') {
    req.headers['content-type'] = 'application/x-www-form-urlencoded';
  }
  next();
});
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}))

app.use(cors(corsOptions));

app.use(fileUpload());

app.use(morgan('dev'))

app.use(express.urlencoded({extended: false})); // 现在就方便多了，express的两个方法一执行就行啦
app.use(express.json())

app.use('/admin', express.static('admin'));
app.use('/', express.static('www'));

app.use('/auth', require('./routes/auth.routes'), require('./admin/routes/auth.routes'))
app.use('/users', require('./routes/users.routes'), require('./admin/routes/users.routes'))
app.use('/pay', require('./routes/pay.routes'), require('./admin/routes/pay.routes'))
app.use('/order', require('./routes/order.routes'), require('./admin/routes/order.routes'))
app.use('/assets', require('./routes/assets.routes'))
app.use('/chat', require('./routes/chat.routes'), require('./admin/routes/chat.routes'))

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化WebSocket聊天服务器
const chatServer = new DbChatServer(server);

server.listen(app.get('port'), () =>
  console.log(`http://localhost:${app.get('port')}`)
)
