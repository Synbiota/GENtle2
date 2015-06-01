var aliases = require('./javascript_aliases');
var envify = require('envify/custom');
var packageConfig = require('../../package.json');

var isDev = process.env.NODE_ENV !== 'production';

var envVarKeys = [
  'ENABLE_BUGSNAG',
  'BUGSNAG_API_KEY',
  'BUGSNAG_RELEASE_STAGE'
];

// Hack to work around Opsworks weird app.env syntax
var pickedEnvVars = envVarKeys.reduce(function(memo, key) {
  var envVar = process.env['export "'+key+'"'];
  if(envVar) memo[key] = envVar;
  return memo;
}, {});

pickedEnvVars.BUGSNAG_APP_VERSION = packageConfig.version;

var transforms = [
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

if(!isDev) {
  transforms.push(
    [ envify(pickedEnvVars), {} ],
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