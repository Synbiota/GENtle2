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
  'BUGSNAG_SERVER_API_KEY',
  'REV_MANIFEST'
];

// Hack to work around Opsworks weird app.env syntax
var pickedEnvVars = envVarKeys.reduce(function(memo, key) {
  var envVar = process.env['export "'+key+'"'];
  if(envVar) memo[key] = envVar;
  return memo;
}, {});

if(pickedEnvVars.REV_MANIFEST) {
  pickedEnvVars.REV_MANIFEST = JSON.parse(pickedEnvVars.REV_MANIFEST.replace(/\\"/g, '"'));
}  else {
  pickedEnvVars.REV_MANIFEST = {};
}

pickedEnvVars.BUGSNAG_APP_VERSION = packageConfig.version;

module.exports = pickedEnvVars;