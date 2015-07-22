/**
@module Home
@submodule Views
@class ParentNewSequenceView
**/
// define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('../templates/parent_new_sequence_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle'),
      ParentNewSequenceView;

  ParentNewSequenceView = Backbone.View.extend({
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

      Filetypes.guessTypeAndParseFromText(text, name).then(Gentle.addSequencesAndNavigate)
        .catch((e) => console.log(e));
    },

    
    convertSmartQuotes: function(text) {
      // single quotes -> '
      return text.replace(/[\u2018\u2019]/g,"\'");
    }

  });
export default ParentNewSequenceView;
  // return NewSequenceView;
// });
