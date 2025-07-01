const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const http = require('http'); // Import http để tạo server HTTP cho socket.io

const indexAPIRouter = require('./routes/index_api');
const indexWEBRouter = require('./routes/index_web');
const database = require('./config/db');

const session = require("express-session");
const { createClient } = require("redis");
const { RedisStore } = require("connect-redis");
const socket = require('./socket'); // Import file socket.js

const app = express();
const PORT = process.env.PORT || 3000;

// Tạo server HTTP
const server = http.createServer(app);

// // // Khởi tạo Socket.IO
// socket.init(server); // Sử dụng hàm init từ file socket.js

// // Khởi tạo Redis client
// let redisClient = createClient({
//   url: process.env.REDIS_URL,
//   legacyMode: false,
//   socket: {
//     connectTimeout: 10000,
//   },
// });

// redisClient.connect().catch(console.error);
// redisClient.on("connect", () => console.log("Connected to Redis successfully"));
// redisClient.on("error", (err) => console.error("Redis connection error:", err));

// // Khởi tạo RedisStore
// let redisStore = new RedisStore({
//   client: redisClient,
//   prefix: "haveninn:",
// });

// Cấu hình session
app.use(
  session({
    // store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "sang",
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 3600000,
    },
  })
);

const methodOverride = require('method-override');
const bodyParser = require('body-parser');
app.use(methodOverride('_method'));


app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Cấu hình EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Route example
app.get('/', (req, res) => {
  res.redirect('https://haven-inn.onrender.com/web/auth/login');
});

// Khởi động server
server.listen(PORT, async () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`http://localhost:${PORT}/web/auth/login`);
});

app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}, Method: ${req.method}`);
  next();
});

const flash = require('connect-flash');
app.use(flash());
app.use(logger('dev'));

app.use('/api', indexAPIRouter);
app.use('/web', indexWEBRouter);

database.connect();
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;