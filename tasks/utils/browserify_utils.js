var aliases = require('./javascript_aliases');
var isDev = process.env.NODE_ENV !== 'production';
var envify = require('envify/custom');
var _ = require('underscore');

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

var transforms = [
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

console.log('ENVIRONMENT VARIABLES', _.keys(process.env))
console.log('PICKED ENVIRONMENT VARIABLES', pickedEnvVars)

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