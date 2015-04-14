/**
@module Designer
@submodule Views
@class HomeDesignerView
**/
define(function(require) {
  var Backbone    = require('backbone'),
      template    = require('../templates/home_designer_view.hbs'),
      Sequence    = require('../../../sequence/models/sequence'),
      TemporarySequence = require('../../../sequence/models/temporary_sequence'),
      Filetypes   = require('../../../common/lib/filetypes/filetypes'),
      Gentle      = require('gentle'),
      Q = require('q'),
      HomeDesignerView;

  HomeDesignerView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'home-designer',

    events: {
      'submit .home-designer-form': 'clickInputElement',
      'change .home-designer-form input[name=file]': 'openSequenceFromFile',
    },
    
    createNewSequence: function(event, loadedSequences) {
      event.preventDefault();
      var $form     = this.$('form').first(),
          name      = $form.find('[name=name]').val() || 'Unnamed',
          sequence  = new Sequence({
            name: name,
            sequence: '',
            displaySettings: {
              primaryView: 'designer'
            },
            meta: {
              designerSequences: loadedSequences, 
            }
            
          });

      Gentle.addSequencesAndNavigate([sequence]);
    },

    openSequenceFromFile: function(event) {
      console.log("runs");
      event.preventDefault();
      var $form     = $('.home-designer-form').first(),
          input     = $form.find('input[name=file]')[0],
          loadedSequences = [],
          _this     = this;

      var onLoad = function(result) {
        return Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name).then ( function ( sequences ) {
          console.log('done sequence')
          if ( sequences.length ) {
            loadedSequences = loadedSequences.concat(sequences);
          } else{
           alert('Could not parse the sequence.');
          }
          console.log('loadedSequences', loadedSequences)
        }, function (err) {
          console.log(err);
          alert('Could not parse the sequence.');
        });
      };

      var onError = function(filename) {
        alert('Could not load file ' + filename);
      };

      var onLoadPromises = _.map(input.files, function(file) {
        return Filetypes.loadFile(file,true).then(onLoad, onError);
      });

      Q.all(onLoadPromises).then(() => {
        console.log('done all sequences', this)
        this.createNewSequence(event, loadedSequences);
      }).done()

    },

    clickInputElement: function(event) {
      event.preventDefault();
      console.log("runs click event");

      this.$('.home-designer-form input[name=file]').click();
    }

   
  });

  return HomeDesignerView;
});