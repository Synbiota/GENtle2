/**
@module Common
@submodule Views
**/
define(function(require) {
  var template      = require('hbars!common/templates/layout'),
      NavbarView    = require('common/views/navbar_view'),
      Backbone      = require('backbone.mixed'),
      Filetypes   = require('common/lib/filetypes/filetypes'),
      Gentle      = require('gentle')(),
      Layout;

  Layout = Backbone.Layout.extend({
    el: '#wrapper',
    template: template,

    initialize: function() {
      this.setView('#navbar', new NavbarView());

    },

    events:{
    'dragover': 'cancelEvent',
    'dragenter':'cancelEvent',
    'drop'     :'loadFiles'
    },

  cancelEvent: function(event){
  if (event.preventDefault) {
      event.preventDefault();
    }
    },

  loadFiles: function(event){
  if (event.preventDefault) event.preventDefault(); 
  if(event.originalEvent.dataTransfer !== undefined){
  var files = event.originalEvent.dataTransfer.files;
  var onLoad = function(result) {
   Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name).then ( function ( sequences ) {
    if ( sequences.length ) Gentle.addSequencesAndNavigate(sequences);
      else alert('Could not parse the sequence.');
     } , function (err) {
       console.log(err);
       alert('Could not parse the sequence.');
     } ) ;
  };
  var onError = function(filename) {
    alert('Could not load file ' + filename);
  };

  _.each(files, function(file) {
    Filetypes.loadFile(file,true).done(onLoad, onError);
  });
  }
  }
  });

  return Layout;
});