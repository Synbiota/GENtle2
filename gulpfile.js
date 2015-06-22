var gulp = require('gulp');

require('./tasks/javascript');
require('./tasks/css');
require('./tasks/deploy');

gulp.task('build', ['js', 'css']);
gulp.task('default', ['js:watch', 'css:watch']);


