var aliases = require('./javascript_aliases');

var transforms = [
  [ 'hbsfy', {compiler: 'require("handlebars.mixed");'} ],
  [ 'babelify', {} ],
  [ 'aliasify', {aliases: aliases} ]
];

module.exports = {
  transforms: transforms,
  applyTransforms: function(browserified) {
    return transforms.reduce(function(b, t) {
      return b.transform(t[0], t[1]);
    }, browserified);
  }
};