var gutil = require('gulp-util');
var prettyHrtime = require('pretty-hrtime');
var notifier = require('node-notifier');
var startTime;

module.exports = {
  start: function(filepath) {
    startTime = process.hrtime();
    gutil.log('Bundling', gutil.colors.green(filepath) + '...');
  },

  watch: function(bundleName, recordTime) {
    if(recordTime) startTime = process.hrtime();
    gutil.log('Watching files required by', gutil.colors.yellow(bundleName));
  },

  rebuild: function(filepath) {
    startTime = process.hrtime();
    gutil.log(gutil.colors.yellow(filepath), 'has changed. Rebuilding...');
  },

  error: function(err) {
    notifier.notify({
      'title': 'Browserify error',
      'message': err.message,
      sound: true
    });
    gutil.log(gutil.colors.magenta('ERROR'), err.message);
  },

  end: function(filepath, watch) {
    var taskTime = process.hrtime(startTime);
    var prettyTime = prettyHrtime(taskTime);
    gutil.log(
      watch ? 'Rebundled' : 'Bundled', 
      gutil.colors.green(filepath), 
      'in', gutil.colors.magenta(prettyTime)
    );
  }
};