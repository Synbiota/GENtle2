var packageConfig = require('../../package.json');
var fs = require('fs');
var envFile = __dirname + '/../../app.env';

if(fs.existsSync(envFile)) {
  require('node-env-file')(envFile);
}

var envVarKeys = [
  'ENABLE_BUGSNAG',
  'BUGSNAG_API_KEY',
  'BUGSNAG_RELEASE_STAGE',
  'BUGSNAG_SERVER_API_KEY'
];

// Hack to work around Opsworks weird app.env syntax
var pickedEnvVars = envVarKeys.reduce(function(memo, key) {
  var envVar = process.env['export "'+key+'"'];
  if(envVar) memo[key] = envVar;
  return memo;
}, {});

pickedEnvVars.BUGSNAG_APP_VERSION = packageConfig.version;

module.exports = pickedEnvVars;