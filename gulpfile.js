var gulp = require('gulp');

require('./tasks/javascript');
require('./tasks/css');

gulp.task('build', ['js', 'css']);
gulp.task('default', ['js:watch', 'css:watch']);


