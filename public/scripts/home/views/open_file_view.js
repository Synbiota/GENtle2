define(function(require) {
  var Backbone    = require('backbone.mixed'),
      template    = require('hbars!home/templates/open_file_view'),
      Filetypes   = require('common/lib/filetypes/filetypes'),
      Gentle      = require('gentle')(),
      NewSequenceView;

  NewSequenceView = Backbone.View.extend({
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
        var sequences = Filetypes.guessTypeAndParseFromText(result.content, result.name);
        Gentle.addSequencesAndNavigate(sequences);
      };

      var onError = function(filename) {
        alert('Could not load file ' + filename);
      };

      _.each(input.files, function(file) {
        Filetypes.loadFile(file).done(onLoad, onError);
      });
    },

    clickInputElement: function(event) {
      event.preventDefault();
      this.$('.home-open-file-form input[name=file]').click();
    }

  });

  return NewSequenceView;
});