var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var cookieParser = require('cookie-parser');
var sessionStore = new RedisStore({
  host: '127.0.0.1',
  port: '6379'
});

var app = express();

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

var cookieParser=cookieParser('cookiechan');
app.use(cookieParser);

var sessionParser = session({
  store:sessionStore,
  secret:'cookiechan',
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: 36000,
    httpOnly: true,
    secure: false
  }
});
app.use(sessionParser);

app.use(function(req,res,next){
  var sessionID=req.headers['Cookie'];
  // console.log('app', sessionID)
  if(sessionID){
    return sessionStore.get(sessionID,function(err,session){
      req.session=Object.assign(req.session||{},session||{});
      next();
    });
  }
  next();
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use('/api', indexRouter);
// app.use('/api',require(path.join(__dirname,'/routes')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
