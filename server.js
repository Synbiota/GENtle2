var path = require('path');
var fs = require('fs');
var PORT = process.env.PORT || 3000;
var isDev = process.env.NODE_ENV !== 'production';
var appEnv = require('./tasks/utils/import_app_env');

var express = require('express');
var app = express();
var bugsnag = require('bugsnag');
bugsnag.register(appEnv.BUGSNAG_SERVER_API_KEY, { 
  releaseStage: process.env.BUGSNAG_RELEASE_STAGE || 'production'
});


if(!isDev && appEnv.ENABLE_BUGSNAG) {
  app.use(bugsnag.requestHandler);
}

// Favicon
var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));

// Serving public files
if(isDev) {
  app.use(express.static(__dirname + '/public'));
} else {
  var gzipStatic = require('connect-gzip-static');
  app.use(gzipStatic(__dirname + '/public', { maxAge: 86400000 * 365 }));
}



// Jade views
app.set('view engine', 'jade');

// Basic logger
var logger = require('morgan');
if(isDev) {
  app.use(logger('dev'));
} else {
  // create a write stream (in append mode)
  var accessLogStream = fs.createWriteStream(__dirname + '/log/server.log', {flags: 'a'});
  app.use(logger('combined', {stream: accessLogStream}));
}

// Understanding JSON requests (POST)
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded());


// Cookies sessions
var session = require('cookie-session');
app.use(session({
  keys: ['lapin']
}));

// Routes
var routes = {};
require('fs').readdirSync('./routes').forEach(function(file) {
  var routeName = file.replace('.js', '');
  routes[routeName] = require('./routes/' + file)[routeName];
});

app.get('/', routes.index);
app.post('/p/:url', routes.proxy);

// Errors handling
var PrettyError = require('pretty-error');
var pe = new PrettyError();
pe.skipNodeFiles(); 
if (isDev) {
  app.use(function(err, req, res, next){
    if(err) console.log(pe.render(err));
    next(err);
  });
} else {
  app.use(bugsnag.errorHandler);
  // app.use(morgan(':id :method :url :response-time'))
  // app.use(function(err, req, res, next){
  //   if(err) errorLogStream.write(pe.render(err));
  //   next(err);
  // });
}

// App startup
app.listen(PORT);
console.log('Express listening on port ' + PORT);

