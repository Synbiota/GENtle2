define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('hbars!templates/home_view'),
      Filetypes   = require('lib/files/filetypes'),
      Gentle      = require('gentle'),
      HomeView;

  Gentle = Gentle();

  HomeView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'submit #home-tab-new-form': 'createNewSequenceFromText'
    },

    createNewSequenceFromText: function(event) {
      event.preventDefault();
      var $form     = $('#home-tab-new-form'),
          text      = $form.find('[name=sequence]').val(),
          name      = $form.find('[name=name]').val(),
          sequences = Filetypes.guessTypeAndParseFromText(text, name);

      if(sequences.length) {
        sequences = _.map(sequences, function(sequence) {
          return Gentle.sequences.create(sequence);
        });
        Gentle.router.navigate('sequence/'+sequences[0].get('id'), {trigger: true});
      } else {
        alert('Could not parse the text.');
      }
    },

    openSequenceFromFile: function(event) {
      event.preventDefault();
      var $form     = $('#home-tab-open-form');

      
    }

  });

  return HomeView;
});