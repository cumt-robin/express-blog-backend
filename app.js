const http = require('http');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet')
// const compression = require('compression');

const routeMiddleware = require('./routes/index');
const ws = require('./utils/ws');

const app = express();

// 完善http头部，提高安全性
app.use(helmet());

// 如果使用Nginx，则在nginx处理gzip即可
// app.use(compression());

const server = http.createServer(app);
const io = require('socket.io')(server);

// session中间件
const sesisonMiddleware = session({
  secret: 'llwb', 
  cookie: ({ path: '/', httpOnly: true, secure: false, maxAge: null }),
  resave: true,  
  saveUninitialized: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || '3000');

app.use(sesisonMiddleware);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 路由中间件
routeMiddleware(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

// socket io
ws.init(io);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
