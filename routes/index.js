var isDev = process.env.NODE_ENV !== 'production';
var scriptPath = 'scripts/app.min.js';
var stylePath = 'stylesheets/app.css';
var manifest = {};

if(!isDev) {
  manifest = require('../rev-manifest.json');
  scriptPath = (manifest[scriptPath] || scriptPath);
  stylePath = (manifest[stylePath] || stylePath);
}

exports.index = function(req, res) {
  res.render('index', {
    env: process.env.NODE_ENV,
    scriptPath: scriptPath,
    stylePath: stylePath
  });
};