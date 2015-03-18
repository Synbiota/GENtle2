var gulp = require('gulp');
// var uglify = require('gulp-uglify');
// var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var bundleLogger = require('./utils/bundle_logger');
var watchify = require('watchify');
var _ = require('underscore');
var path = require('path');
var gzip = require('gulp-gzip');

var scriptFile = './public/scripts/app.js';
var scriptPath = path.dirname(scriptFile);

var destPath = './';
var destExtname = '.min.js';
var isDev = process.env.NODE_ENV !== 'production';
var browserifyOptions = {};

if(isDev) {
  browserifyOptions.debug = true;
}

var run = function(watch) {
  var browserified = watch ? 
    watchify(browserify(scriptFile, _.extend(browserifyOptions, watchify.args))) :
    browserify(scriptFile, browserifyOptions);

  browserified = browserified
    .transform('hbsfy', { compiler: 'require("handlebars.mixed");'})
    .transform(babelify)
    .transform('deamdify');

  if(!isDev) {
    browserified = browserified.transform('uglifyify', { global: true });
  }

  if(watch) {
    bundleLogger.watch(scriptFile);
    browserified.on('update', _.partial(bundle, browserified, true));
  } 

  bundle(browserified); 
};

var bundle = function(browserified, watch, filepath) {
  var target = scriptFile;

  if(watch) {
    bundleLogger.rebuild(path.relative(target, filepath[0]));
  } else {
    bundleLogger.start(target);
  }

  browserified = browserified.bundle()
    .on('error', bundleLogger.error)
    .on('end', function() { bundleLogger.end(target, watch); })
    .pipe(source(scriptFile))
    .pipe(rename({extname: destExtname}))
    .pipe(gulp.dest(destPath));

  if(!isDev) {
    browserified = browserified
      .pipe(gzip())
      .pipe(gulp.dest(destPath));
  }

  return browserified;
};

gulp.task('js', function() { run(false); });
gulp.task('js:watch', function() { run(true); });



