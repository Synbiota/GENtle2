var gutil = require('gulp-util');
var prettyHrtime = require('pretty-hrtime');
var notifier = require('node-notifier');
var just = require('string-just');
var startTime;

var header = function(str, color) {
  // color = 'bg' + color[0].toUpperCase() + color.substr(1, color.length - 1);
  // return gutil.colors.dim(gutil.colors[color](just.ljust('[' + str.toLowerCase() + ']', 11)));
  color = color || 'magenta';
  return gutil.colors.dim(gutil.colors[color](just.ljust( str, 8)));
};

var filename = function(str, color) {
  color = color || 'magenta';
  return '\'' + gutil.colors[color](str)  + '\'';
};

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
    var pluginName = err.plugin || 'browserify';

    notifier.notify({
      title: 'ERROR - ' + pluginName,
      message: err.message,
      sound: true
    });

    var lineNumber = typeof err.lineNumber === 'undefined' ? '' : 
      'at line ' + err.lineNumber

    gutil.log(
      header('Error', 'magenta'), 
      gutil.colors.magenta(gutil.colors.underline(pluginName))
    );

    if(lineNumber || err.fileName) {
      gutil.log(
        header(''), 
        err.fileName ? filename(err.fileName) : '', 
        lineNumber
      );
    }

    gutil.log(header(''), err.message);
  },

  end: function(filepath, watch) {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    notifier.notify({
      title: 'Bundle complete',
      message: filepath,
      sound: false
    });
    gutil.log(
      header('Bundled', 'green'), 
      filename(filepath, 'green'), 
      'after', gutil.colors.magenta(prettyTime)
    );
  }
};