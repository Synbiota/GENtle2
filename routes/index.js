var isDev = process.env.NODE_ENV !== 'production';

var appPath = 'scripts/app.min.js';
var vendorPath = 'scripts/vendor.js';
var stylePath = 'stylesheets/app.css';
var manifest = {};

if(!isDev) {
  appPath = (manifest[appPath] || appPath);
  stylePath = (manifest[stylePath] || stylePath);
  vendorPath = (manifest[vendorPath] || vendorPath);
}

exports.index = function(req, res) {
  res.render('index', {
    env: process.env.NODE_ENV,
    appPath: appPath,
    stylePath: stylePath,
    vendorPath: vendorPath
  });
};
