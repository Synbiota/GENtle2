// define(function(require) {
  var Gentle    = require('gentle'),
      NCBIView  = require('./views/ncbi_view');

  Gentle.addPlugin('home', {
    name: 'ncbi',
    title: 'Search NCBI',
    view: NCBIView
  });

  // return Math;
// });