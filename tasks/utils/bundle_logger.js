var gutil = require('gulp-util');
var prettyHrtime = require('pretty-hrtime');
var notifier = require('node-notifier');
var just = require('string-just');
var startTime;

var header = function(str, color) {
  // color = 'bg' + color[0].toUpperCase() + color.substr(1, color.length - 1);
  // return gutil.colors.dim(gutil.colors[color](just.ljust('[' + str.toLowerCase() + ']', 11)));
  return gutil.colors.dim(gutil.colors[color](just.ljust( str, 8)));
};

var filename = function(str, color) {
  return '\'' + gutil.colors[color](str)  + '\'';
}

module.exports = {
  start: function(filepath) {
    startTime = process.hrtime();
    gutil.log(header('Bundling', 'cyan'), filename(filepath, 'cyan'));
  },

  watch: function(bundleName, recordTime) {
    if(recordTime) startTime = process.hrtime();
    gutil.log(header('Watching', 'yellow'), filename(bundleName, 'yellow'));
  },

  rebuild: function(filepath) {
    startTime = process.hrtime();
    gutil.log(header('Changed', 'yellow'), filename(filepath, 'yellow'));
  },

  error: function(err) {
    notifier.notify({
      'title': 'Browserify error',
      'message': err.message,
      sound: true
    });
    gutil.log(header('Error', 'magenta'), err.message);
  },

  end: function(filepath, watch) {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    gutil.log(
      header('Bundled', 'green'), 
      filename(filepath, 'green'), 
      'in', gutil.colors.magenta(prettyTime)
    );
  }
};