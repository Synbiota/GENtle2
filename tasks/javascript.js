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
var transform = require('vinyl-transform');
var exorcist = require('exorcist');

var scriptFile = './public/scripts/app.js';
var scriptPath = path.dirname(scriptFile);

var destPath = './';
var destExtname = '.min.js';
var isDev = process.env.NODE_ENV !== 'production';
var browserifyOptions = {
  debug: true
};

var browserifyUtils = require('./utils/browserify_utils');

var run = function(watch) {
  var browserified = watch ? 
    watchify(browserify(scriptFile, _.extend(browserifyOptions, watchify.args))) :
    browserify(scriptFile, browserifyOptions);

  browserified = browserifyUtils.applyConfig('app', browserified);

  if(watch) {
    bundleLogger.watch(scriptFile);
    browserified.on('update', _.partial(bundle, browserified, true));
  } 

  bundle(browserified); 
};

var productionTransforms = function(browserified) {
  return browserified
    .pipe(buffer())
    .pipe(rev())
    .pipe(transform(function(filename) { return exorcist(filename + '.map'); }))
    .pipe(gulp.dest(destPath)) 
    .pipe(gzip())
    .pipe(gulp.dest(destPath))
    .pipe(rev.manifest({merge: true}))
    .pipe(replace('.gz', ''))
    .pipe(replace('public/', ''))
    .pipe(gulp.dest(destPath)); 
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
    browserified = productionTransforms(browserified);
  }
};

gulp.task('js:vendor', function() {
  var target = './public/scripts/vendor.js';
  bundleLogger.start(target);
  var browserified = browserify({debug: true});

  browserified = browserifyUtils.applyConfig('vendor', browserified)
    .bundle()
    .on('error', bundleLogger.error)
    .on('end', function() { bundleLogger.end(target, false); })
    .pipe(source(target))
    .pipe(gulp.dest(destPath));

  if(!isDev) {
    browserified = productionTransforms(browserified);
  }
});


gulp.task('js', ['js:vendor'], function() { run(false); });
gulp.task('js:watch', ['js:vendor'], function() { run(true); });



