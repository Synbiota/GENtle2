/**
@module Home
@submodule Views
@class NewSequenceView
**/
define(function(require) {
  var Backbone    = require('backbone.mixed'),
      template    = require('../templates/new_sequence_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle')(),
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
          text      = $form.find('[name=sequence]').val(),
          name      = $form.find('[name=name]').val() || 'Unnamed';

      Filetypes.guessTypeAndParseFromText(text, name).then(Gentle.addSequencesAndNavigate);
    }
  });

  return NewSequenceView;
});