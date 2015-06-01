var aliases = require('./javascript_aliases');
var isDev = process.env.NODE_ENV !== 'production';

var transforms = [
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

if(!isDev) {
  transforms.push([ 'envify', {} ]);
}

module.exports = {
  transforms: transforms,
  applyTransforms: function(browserified) {
    return transforms.reduce(function(b, t) {
      return b.transform(t[0], t[1]);
    }, browserified);
  }
};