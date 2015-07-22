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
var glob = require('glob');

var scriptFile = './public/scripts/app.js';
var scriptPath = path.dirname(scriptFile);

var destPath = './';
var destExtname = '.min.js';
var isDev = global.isDev;
var browserifyOptions = {
  debug: true
};

var browserifyUtils = require('./utils/browserify_utils');

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

var bundle = function(browserified, options) {
  _.defaults(options, {
    watch: false,
    target: scriptFile
  });

  var target = options.target;

  if(options.watch) {
    bundleLogger.rebuild(path.relative(target, options.filepath[0]), target);
  } else {
    bundleLogger.start(target);
  }

  browserified = browserified
    .bundle()
    .on('error', function(err) {
      bundleLogger.error(err);
      if(options.cb) options.cb(err);
    })
    .pipe(source(target))
    .pipe(rename({extname: destExtname}))
    .pipe(gulp.dest(destPath));

  if(!isDev) {
    browserified = productionTransforms(browserified);
  }

  browserified.on('end', function() { 
    bundleLogger.end(target, options.watch); 
    if(options.cb) options.cb();
  });
};

var run = function(options) {
  _.defaults(options, {
    watch: false
  });

  var browserified = options.watch ? 
    watchify(browserify(scriptFile, _.extend(browserifyOptions, watchify.args))) :
    browserify(scriptFile, browserifyOptions);

  browserified = browserifyUtils.applyConfig('app', browserified);

  if(options.watch) {
    bundleLogger.watch(scriptFile);
    browserified.on('update', function(filepath) {
      bundle(browserified, {watch: true, filepath: filepath});
    }); 
  } 

  bundle(browserified, _.pick(options, 'cb')); 
};

gulp.task('js:vendor', function() {
  var target = './public/scripts/vendor.js';
  bundleLogger.start(target);
  var browserified = browserify({debug: true});
  var def = Q.defer();

  browserified = browserifyUtils.applyConfig('vendor', browserified)
    .bundle()
    .pipe(source(target))
    .pipe(gulp.dest(destPath));

  if(!isDev) {
    browserified = productionTransforms(browserified);
  }

  browserified
    .on('error', function(err) {
      bundleLogger.error(err);
      def.reject();
    })
    .on('end', function() { 
      bundleLogger.end(target, false); 
      def.resolve();
    });

  return def.promise;
});

gulp.task('js:app', function() {
  var def = Q.defer();

  run({
    cb: function(err) {
      if(err) def.reject();
      else def.resolve();
    }
  });

  return def.promise;
});

gulp.task('js', ['js:vendor', 'js:app']);
gulp.task('js:watch', ['js:vendor'], function() { run({watch: true}); });


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


var buildSpecBundle = function(watch, cb) {
  var target = './public/scripts/all_specs.js';
  var specEntries = [
    './specs.header.js'
  ].concat(glob.sync('./public/scripts/**/*[Ss]pec.js'));

  var options = {debug: true, entries: specEntries};

  var browserified = watch ? 
    watchify(browserify(_.extend(options, watchify.args))) :
    browserify(options);

  browserified = browserifyUtils.applyConfig('app', browserified);

  if(watch) {
    bundleLogger.watch(scriptFile);
    browserified.on('update', function(filepath) {
      bundle(browserified, {
        watch: true, 
        filepath: filepath, 
        target: target
      });
    }); 
  } 

  bundle(browserified, {target: target, cb: cb}); 
};


gulp.task('test:build', ['test:checkvendor'], function(cb) {
  return buildSpecBundle(false, cb);
});

gulp.task('test:watch', ['test:checkvendor'], function() {
  buildSpecBundle(true);
});


var jasmineBrowser = require('gulp-jasmine-browser');
var gwatch = require('gulp-watch');

var specFiles = [
  './public/scripts/vendor.js', 
  './public/scripts/all_specs.min.js'
];

gulp.task('test:checkvendor', function() {
  if(!fs.existsSync('./public/scripts/vendor.js')) {
    throw new Error('vendor.js is missing. Please run `gulp` or `gulp js:vendor` first');
  }
});  

gulp.task('test', ['test:watch'], function() {
  return gulp.src(specFiles)
    .pipe(gwatch(specFiles))
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server());
});

gulp.task('test:headless', ['test:build'], function() {
  var files = [
    './public/scripts/vendor.js', 
    './public/scripts/all_specs.min.js'
  ];

  return gulp.src(files)
    .pipe(jasmineBrowser.specRunner({console: true}))
    .pipe(jasmineBrowser.headless());
});
