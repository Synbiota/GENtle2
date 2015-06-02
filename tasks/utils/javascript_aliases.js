var glob = require('glob');

var aliases = glob
  .sync('./public/scripts/library/*/*.js')
  .reduce(function(memo, path) {
    var cleanPath = 'gentle-' + path
      .replace('./public/scripts/library/', '')
      .replace('.js', '');

    memo[cleanPath] = path;
    if(/\/index$/.test(cleanPath)) memo[cleanPath.replace('/index', '')] = path;

    return memo;
  }, {});

module.exports = aliases;