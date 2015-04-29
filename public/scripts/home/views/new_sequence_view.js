/**
@module Home
@submodule Views
@class NewSequenceView
**/
define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('../templates/new_sequence_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle'),
      NewSequenceView;

  NewSequenceView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'home-new-sequence',

    events: {
      'submit .home-new-sequence-form': 'createNewSequenceFromText',
    },

    createNewSequenceFromText: function(event) {
      event.preventDefault();
      
      var $form     = $('.home-new-sequence-form').first(),
          text      = this.convertSmartQuotes($form.find('[name=sequence]').val()),
          name      = $form.find('[name=name]').val() || 'Unnamed';

      console.log(text)     
      Filetypes.guessTypeAndParseFromText(text, name).then(Gentle.addSequencesAndNavigate)
        .catch((e) => console.log(e));
    },

    
    convertSmartQuotes: function(text) {
      // single quotes -> '
      return text.replace(/[\u2018\u2019]/g,"\'");
    }

  });

  
  return NewSequenceView;
});