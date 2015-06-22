var glob = require('glob');
var _ = require('underscore');

var aliases = glob
  .sync('./public/scripts/library/**/*.{js,html,hbs}')
  .reduce(function(memo, path) {
    if(/spec/.test(path)) return memo;
    var cleanPath = 'gentle-' + path
      .replace('./public/scripts/library/', '')
      .replace('.js', '');

    memo[cleanPath] = path;
    if(/\/index$/.test(cleanPath)) memo[cleanPath.replace('/index', '')] = path;

    return memo;
  }, {});
  
module.exports = aliases;