var gulp = require('gulp');
var fs = require('fs');
var envFile = __dirname + '/app.env';

if(fs.existsSync(envFile)) {
  require('node-env-file')(__dirname + '/app.env');
}

require('./tasks/javascript');
require('./tasks/css');

gulp.task('build', ['js', 'css']);
gulp.task('default', ['js:watch', 'css:watch']);


