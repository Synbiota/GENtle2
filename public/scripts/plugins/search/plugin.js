define(function(require) {
  var Gentle    = require('gentle')(),
      SearchView  = require('./views/search_view');

  Gentle.addPlugin('sequence-settings-tab', {
    name: 'searchSequence',
    title: 'Search',
    view: SearchView
  });

  return Gentle;
});

