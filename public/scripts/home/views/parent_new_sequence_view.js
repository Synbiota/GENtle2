/**
@module Home
@submodule Views
@class ParentNewSequenceView
**/

  var Backbone    = require('backbone'),
      Handlebars  = require('handlebars'),
      template    = require('../templates/parent_new_sequence_view.hbs'),
      Filetypes   = require('../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle'),
      NewSequenceView = require('./new_sequence_view'),
      OpenFileView = require('./open_file_view'),
      NCBIView = require('../../plugins/ncbi/views/ncbi_view'),
      ParentNewSequenceView;


  ParentNewSequenceView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'parent-home-new-sequence',

    events: {
      //'submit .home-new-sequence-form': 'createNewSequenceFromText',
      //'click .home-open-file-form a.btn': 'this.clickInputElement',
      //'change .home-open-file-form input[name=file]': 'this.openSequenceFromFile'
    },

    createNewSequenceFromText: function(event) {
      event.preventDefault();

      var $form     = $('.home-new-sequence-form').first(),
          text      = this.convertSmartQuotes($form.find('[name=sequence]').val()),
          name      = $form.find('[name=name]').val() || 'Unnamed';

      Filetypes.guessTypeAndParseFromText(text, name)
      .then(Gentle.addSequencesAndNavigate)
      .catch((e) => console.error(e))
      .done();
    },


    convertSmartQuotes: function(text) {
      // single quotes -> '
      return text.replace(/[\u2018\u2019]/g,"\'");
    },

    initialize: function() {
      this.openFileView = new OpenFileView();
      this.newSequenceView = new NewSequenceView();
      this.ncbiView = new NCBIView();
      this.setView('.home-open-file', this.openFileView);
      // this.setView('.home-new-sequence', this.newSequenceView);
      // this.setView('.home-ncbi',this.ncbiView);
    },





  });

export default ParentNewSequenceView;
