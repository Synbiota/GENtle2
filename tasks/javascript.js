var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var bundleLogger = require('./utils/bundle_logger');
var watchify = require('watchify');
var _ = require('underscore');
var path = require('path');
var gzip = require('gulp-gzip');
var rev = require('gulp-rev');
var buffer = require('gulp-buffer');
var replace = require('gulp-replace');

var scriptFile = './public/scripts/app.js';
var scriptPath = path.dirname(scriptFile);

var destPath = './';
var destExtname = '.min.js';
var isDev = process.env.NODE_ENV !== 'production';
var browserifyOptions = {};

var browserifyUtils = require('./utils/browserify_utils');

if(isDev) {
  browserifyOptions.debug = true;
}

var run = function(watch) {
  var browserified = watch ? 
    watchify(browserify(scriptFile, _.extend(browserifyOptions, watchify.args))) :
    browserify(scriptFile, browserifyOptions);

  browserified = browserifyUtils.applyTransforms(browserified);

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
      .pipe(buffer())
      .pipe(rev())
      .pipe(gulp.dest(destPath)) 
      .pipe(gzip())
      .pipe(gulp.dest(destPath))
      .pipe(rev.manifest({merge: true}))
      .pipe(replace('.gz', ''))
      .pipe(replace('public/', ''))
      .pipe(gulp.dest(destPath)); 
  }
};

gulp.task('js', function() { run(false); });
gulp.task('js:watch', function() { run(true); });



