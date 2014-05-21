var // Core
  path        = require('path'),

  // Koa and middlewares
  koa         = require('koa'),
  favicon     = require('koa-favicon'),
  router      = require('koa-router'),
  views       = require('koa-views'),
  serve       = require('koa-static'),

  // App
  app         = koa(),
  routes      = {},

  // App config
  PORT        = process.env.PORT || 3000;


// Middleware usage
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.use(serve('public'));
app.use(views('views', {
  default: 'jade'
}));
app.use(router(app));

// Routes
require('fs').readdirSync('./routes').forEach(function(file) {
  var routeName = file.replace('.js', '');
  routes[routeName] = require('./routes/' + file)[routeName];
});

app.get('/', routes.index);
app.post('/p/:url', routes.proxy);

app.listen(PORT);
console.log('Koa listening on port ' + PORT);

