define(function(require) {
  var template    = require('hbars!templates/home_view'),
      Filetypes   = require('lib/files/filetypes'),
      Backbone    = require('backbone.mixed'),
      Gentle      = require('gentle'),
      HomeView;

  Gentle = Gentle();

  HomeView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'submit #home-tab-new-form': 'createNewSequenceFromText',
      'change #home-tab-open-form input[name=file]': 'openSequenceFromFile'
    },

    addSequencesAndNavigate: function(sequences) {
      if(sequences.length) {
        sequences = _.map(sequences, function(sequence) {
          return Gentle.sequences.create(sequence);
        });
        Gentle.router.sequence(sequences[0].get('id'));
      } else {
        alert('Could not parse the sequence.');
      }
    },

    createNewSequenceFromText: function(event) {
      event.preventDefault();
      var $form     = $('#home-tab-new-form'),
          text      = $form.find('[name=sequence]').val(),
          name      = $form.find('[name=name]').val() || 'Unnamed',
          sequences = Filetypes.guessTypeAndParseFromText(text, name);

      this.addSequencesAndNavigate(sequences);
    },

    openSequenceFromFile: function(event) {
      event.preventDefault();
      var $form     = $('#home-tab-open-form'),
          input     = $form.find('input[name=file]')[0],
          _this     = this;

      var onLoad = function(result) {
        var sequences = Filetypes.guessTypeAndParseFromText(result.content, result.name);
        _this.addSequencesAndNavigate(sequences);
      };

      var onError = function(filename) {
        alert('Could not load file ' + filename);
      };

      _.each(input.files, function(file) {
        Filetypes.loadFile(file).done(onLoad, onError);
      });
    }

  });

  return HomeView;
});