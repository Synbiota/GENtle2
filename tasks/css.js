var gulp = require('gulp');
var sass = require('gulp-sass');
var bourbon = require('node-bourbon');
var rename = require('gulp-rename');
var cssGlobbing = require('gulp-css-globbing');
var bundleLogger = require('./utils/bundle_logger');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var path = require('path');

var filepath = './public/stylesheets/app.scss';
var filedir = path.dirname(filepath);

var run = function(watch) {

  if(watch) {
    bundleLogger.watch(filepath);
    bundleLogger.start(filepath);
  } else {
    bundleLogger.start(filepath);
  }

  gulp.src(filepath)
    .pipe(cached('stylesheets'))
    .pipe(cssGlobbing())
    .pipe(sass({ includePaths: bourbon.includePaths }))
    .on('end', function() { bundleLogger.end(filepath.replace('.scss', '.css')); })
    .pipe(remember('stylesheets')) 
    .pipe(rename({ extname: '.css' }))
    .pipe(gulp.dest('./public/stylesheets/'));

};

gulp.task('css', function() { run(false); } );

gulp.task('css:watch', function() { 
  run(true);
  var watcher = gulp.watch('./public/stylesheets/**/*.scss', ['css']);
  watcher.on('change', function (event) {
    bundleLogger.rebuild(path.relative(filedir, event.path));
    if (event.type === 'deleted') {                  
      delete cached.caches.stylesheets[event.path];      
      remember.forget('stylesheets', event.path);        
    }
  });
});

