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
var disc = require('disc');
var open = require('opener');
var fs = require('fs');
var Q = require('q');

var scriptFile = './public/scripts/app.js';
var scriptPath = path.dirname(scriptFile);

var destPath = './';
var destExtname = '.min.js';
var isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
var browserifyOptions = {
  debug: true
};

var browserifyUtils = require('./utils/browserify_utils');

var run = function(watch, cb) {
  var browserified = watch ? 
    watchify(browserify(scriptFile, _.extend(browserifyOptions, watchify.args))) :
    browserify(scriptFile, browserifyOptions);

  browserified = browserifyUtils.applyConfig('app', browserified);

  if(watch) {
    bundleLogger.watch(scriptFile);
    browserified.on('update', _.partial(bundle, browserified, true));
  } 

  bundle(browserified, null, null, cb); 
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

var bundle = function(browserified, watch, filepath, cb) {
  var target = scriptFile;

  if(watch) {
    bundleLogger.rebuild(path.relative(target, filepath[0]));
  } else {
    bundleLogger.start(target);
  }

  browserified = browserified.bundle()
    .on('error', function(err) {
      bundleLogger.error(err);
      if(cb) cb(err);
    })
    .on('end', function() { 
      bundleLogger.end(target, watch); 
      if(cb) cb();
    })
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
  var def = Q.defer();

  browserified = browserifyUtils.applyConfig('vendor', browserified)
    .bundle()
    .on('error', function(err) {
      bundleLogger.error(err);
      def.reject();
    })
    .on('end', function() { 
      bundleLogger.end(target, false); 
      def.resolve();
    })
    .pipe(source(target))
    .pipe(gulp.dest(destPath));

  if(!isDev) {
    browserified = productionTransforms(browserified);
  }

  return def.promise;
});

gulp.task('js:app', function() {
  var def = Q.defer();

  run(false, function(err) {
    if(err) def.reject();
    else def.resolve();
  });

  return def.promise;
});

gulp.task('js', ['js:vendor', 'js:app']);
gulp.task('js:watch', ['js:vendor'], function() { run(true); });


var discify = function(filepath, bundleType) {
  var filename = filepath.split('/');
  filename = filename[filename.length - 1];
  var output = './disc_'+filename+'.html';
  var fullPath = path.resolve(filepath);

  browserifyUtils.applyConfig(bundleType, browserify(fullPath, _.extend({
    fullPaths: true
  }, browserifyOptions)))
    .transform('uglifyify', { global: true })
    .bundle()
    .pipe(disc())
    .pipe(fs.createWriteStream(output))
    .once('close', function() {
      open(output);
    });
};

gulp.task('js:deps', function() {
  discify(scriptFile, 'app');
  // discify('./public/scripts/vendor.js', 'vendor'); // TODO FIX THAT
});



