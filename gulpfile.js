if(require('fs').existsSync('.env')) require('dotenv').load();
global.isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

var gulp = require('gulp');

require('./tasks/javascript');
require('./tasks/css');
require('./tasks/publish');

gulp.task('build', ['js', 'css']);
gulp.task('default', ['js:watch', 'css:watch']);


