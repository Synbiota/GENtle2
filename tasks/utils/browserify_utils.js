var aliases = require('./javascript_aliases');
var envify = require('envify/custom');
var appEnv = require('./import_app_env');
var isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

var vendorLibs = [
  'jquery',
  'backbone',
  'underscore',
  'bootstrap',
  'handlebars',
  'backbone-deep-model',
  'backbone.layoutmanager',
  'backbone.localstorage',
  'bugsnag-js',
  'filesaver.js',
  'jquery-ui',
  'jquery-ui-touch-punch',
  'q',
  'underscore-deep-extend'
];

var appTransforms = [
  [ 'jstify', {minifierOpts: {collapseWhitespace: false}} ],
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

var vendorTransforms = [];

if(!isDev) {
  appTransforms.push(
    [ envify(appEnv), {} ],
    [ 'uglifyify', { global: true } ]
  );

  vendorTransforms.push(
    [ 'uglifyify', { global: true } ]
  );
}

module.exports = {
  appTransforms: appTransforms,
  vendorTransforms: vendorTransforms,
  vendorLibs: vendorLibs,

  applyConfig: function(bundleType, browserified) {
    var transforms;

    if(bundleType === 'app') {
      browserified.external(vendorLibs);
      transforms = appTransforms;
    } else {
      browserified.require(vendorLibs);
      transforms = vendorTransforms;
    }

    browserified = transforms.reduce(function(b, t) {
      return b.transform(t[0], t[1]);
    }, browserified);

    return browserified;
  }
};