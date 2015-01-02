/**
@module Home
@submodule Views
@class OpenFileView
**/
define(function(require) {
  var Backbone    = require('backbone.mixed'),
      template    = require('../templates/open_file_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle')(),
      OpenFileView;

  OpenFileView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'home-open-file',

    events: {
      'click .home-open-file-form a.btn': 'clickInputElement',
      'change .home-open-file-form input[name=file]': 'openSequenceFromFile'
    },
    
    openSequenceFromFile: function(event) {
      event.preventDefault();
      var $form     = $('.home-open-file-form').first(),
          input     = $form.find('input[name=file]')[0],
          _this     = this;

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

      _.each(input.files, function(file) {
        Filetypes.loadFile(file,true).done(onLoad, onError);
      });
    },

    clickInputElement: function(event) {
      event.preventDefault();
      this.$('.home-open-file-form input[name=file]').click();
    }

  });

  return OpenFileView;
});