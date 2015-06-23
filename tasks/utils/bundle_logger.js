var gutil = require('gulp-util');
var prettyHrtime = require('pretty-hrtime');
var notifier = require('node-notifier');
var just = require('string-just');
var startTime = {};

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

var getStartTimeKey = function(operation, filepath) {
  return operation+'-'+filepath.replace(/\.\w+$/, '');
};

var setStartTime = function(operation, filepath) {
  startTime[getStartTimeKey(operation, filepath)] = process.hrtime();
};

var getStartTime = function(operation, filepath) {
  var key = getStartTimeKey(operation, filepath);
  var time = startTime[key];
  return time;
};

module.exports = {
  start: function(filepath) {
    setStartTime('build', filepath);
    gutil.log(header('Bundling', 'cyan'), filename(filepath, 'cyan'));
  },

  watch: function(bundleName, recordTime) {
    if(recordTime) setStartTime('rebuild', bundleName);
    gutil.log(header('Watching', 'yellow'), filename(bundleName, 'yellow'));
  },

  rebuild: function(filepath, bundleName) {
    setStartTime('rebuild', bundleName);
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
    var time = getStartTime(watch ? 'rebuild' : 'build', filepath);
    var prettyTime = prettyHrtime(process.hrtime(time));
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
  },


  skip: function(filepath) {
    gutil.log(header('Skipping', 'cyan'), filename(filepath, 'cyan'));
  },

  upload: function(filepath) {
    startTime['upload-'+filepath] = process.hrtime();
    gutil.log(header('Uploadng', 'yellow'), filename(filepath, 'yellow'));
  },

  uploadDone: function(filepath) {
    var startTimeKey = 'upload-' + filepath;
    var taskTime = process.hrtime(startTime[startTimeKey]);
    delete startTime[startTimeKey];
    var prettyTime = prettyHrtime(taskTime);
    gutil.log(
      header('Uploaded', 'green'), 
      filename(filepath, 'green'), 
      'after', gutil.colors.magenta(prettyTime)
    );
  }                   
};