var aliases = require('./javascript_aliases');
var isDev = process.env.NODE_ENV !== 'production';
var envify = require('envify/custom');
var _ = require('underscore');

var transforms = [
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

if(!isDev) {
  transforms.push(
    [ envify(_.pick(process.env, 
      'ENABLE_BUGSNAG',
      'BUGSNAG_API_KEY',
      'BUGSNAG_RELEASE_STAGE'
    )), {} ],
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