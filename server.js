var // Core
    path        = require('path'),

    // Koa and middlewares
    koa         = require('koa'),
    favicon     = require('koa-favicon'),
    route       = require('koa-route'),
    views       = require('koa-views'),
    serve       = require('koa-static'),

    // App
    routes      = require('./routes'),
    app         = koa(),

    // App config
    PORT        = process.env.PORT || 3000;


// app.set('port', process.env.PORT || 3000);
// app.set('views', path.join(__dirname, '/views'));
// app.set('view engine', 'jade');


// app.use(favicon(path.join(__dirname, '/public/images/favicon.png')));
// // app.use(express.bodyParser());
// // app.use(express.methodOverride());
// // app.use(express.cookieParser('yoàevvsdfvsdfgdsfrfsefd44efrre'));
// // app.use(express.session());
// app.use(app.router);
// app.use(express.static(path.join(__dirname, 'public')));

// if(app.settings.env == 'development') {
//   app.use(express.errorHandler());
//   app.use(express.logger('dev'));
// }

// app.get('/', routes.index);

// Middleware usage
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.use(serve('public'));
app.use(views('views', {
  default: 'jade'
}));

// Routes
app.use(route.get('/', routes.index));

app.listen(PORT);
console.log('Koa listening on port ' + PORT);

