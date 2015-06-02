var aliases = require('./javascript_aliases');
var envify = require('envify/custom');
var appEnv = require('./import_app_env');
var isDev = process.env.NODE_ENV !== 'production';

var transforms = [
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

if(!isDev) {
  transforms.push(
    [ envify(appEnv), {} ],
    [ 'uglifyify', { global: true } ]
  );
}

module.exports = {
  transforms: transforms,
  applyTransforms: function(browserified) {
    return transforms.reduce(function(b, t) {
      return b.transform(t[0], t[1]);
    }, browserified);
  }
};