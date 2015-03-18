var gulp = require('gulp');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var cssGlobbing = require('gulp-css-globbing');
var bundleLogger = require('./utils/bundle_logger');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var path = require('path');
var fs = require('fs');
var jsonSass = require('json-sass');
var source = require('vinyl-source-stream');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var minifyCss = require('gulp-minify-css');
var plumber = require('gulp-plumber');

var isDev = process.env.NODE_ENV !== 'production';

var filepath = './public/stylesheets/app.scss';
var filedir = path.dirname(filepath);

var themeJsonPath = './public/scripts/styles.json';
var themeScssDest = './';

var sassOptions = {
  // includePaths: bourbon.includePaths,
  errLogToConsole: false,
};

var cssGlobbingOptions = {
  extensions: ['.css', '.scss']
};

var autoprefixerOptions = {
  browsers: [
    '> 1%', 
    'last 2 versions', 
    'Firefox ESR', 
    'Opera 12.1',
    'ie > 8'
  ],
  cascade: false
};

var run = function(watch) {

  if(watch) {
    bundleLogger.watch(filepath);
    bundleLogger.start(filepath);
  } else {
    bundleLogger.start(filepath);
  }

  var bundle = gulp.src(filepath)
    .pipe(plumber({errorHandler: bundleLogger.error}))
    .pipe(cached('stylesheets'))
    .pipe(cssGlobbing(cssGlobbingOptions));

  if(isDev) {
    bundle = bundle
      .pipe(sourcemaps.init())
      .pipe(sass(sassOptions))
      .pipe(sourcemaps.write());
  } else {
    bundle = bundle
      .pipe(sass(sassOptions))
      .pipe(autoprefixer(autoprefixerOptions))
      .pipe(minifyCss());
  }

  bundle = bundle
    .on('end', function() { bundleLogger.end(filepath.replace('.scss', '.css')); })
    .on('error', bundleLogger.error)
    .pipe(remember('stylesheets')) 
    .pipe(rename({ extname: '.css' }))
    .pipe(gulp.dest('./public/stylesheets/'));

};

var buildTheme = function(cb) {
  bundleLogger.start(themeJsonPath);
  fs.createReadStream(themeJsonPath)
    .pipe(plumber())
    .pipe(jsonSass({
      prefix: '$shared-styles: ',
    }))
    .pipe(source(themeJsonPath))
    .pipe(rename({extname: '.scss'}))
    .on('end', function() { 
      bundleLogger.end(themeJsonPath.replace('.json', '.scss'));
      cb();
    })
    .pipe(gulp.dest(themeScssDest));
  };

gulp.task('theme', buildTheme);

gulp.task('css', function() { buildTheme(function() { run(false); }); });

gulp.task('css-only', function() { run(false); });

gulp.task('css:watch', function() { 
  run(true);

  gulp.watch('./public/scripts/styles.json', ['theme']);

  gulp.watch('./public/{stylesheets,scripts}/**/*.scss', ['css-only'])
    .on('change', function (event) {
      bundleLogger.rebuild(path.relative(filedir, event.path));
      if (event.type === 'deleted') {                  
        delete cached.caches.stylesheets[event.path];      
        remember.forget('stylesheets', event.path);        
      }
    });
});

