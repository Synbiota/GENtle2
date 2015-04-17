/**
@module Designer
@submodule Views
@class HomeDesignerView
**/
import Backbone from 'backbone';
import template from '../templates/home_designer_view.hbs';
import Sequence from '../../../sequence/models/sequence';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import Gentle from 'gentle';
import Q from 'q';
import _ from 'underscore';

export default Backbone.View.extend({
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
            designer: {
              sequences: loadedSequences, 
            },
          }
          
        });

    Gentle.addSequencesAndNavigate([sequence]);
  },

  openSequenceFromFile: function(event) {
    event.preventDefault();
    var $form     = $('.home-designer-form').first(),
        input     = $form.find('input[name=file]')[0],
        loadedSequences = [];

    var onLoad = function(result) {
      return Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name).then ( function ( sequences ) {
        if ( sequences.length ) {
          loadedSequences = loadedSequences.concat(sequences);
        } else{
         alert('Could not parse the sequence.');
        }
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
      this.createNewSequence(event, loadedSequences);
    }).done();

  },

  clickInputElement: function(event) {
    event.preventDefault();
    this.$('.home-designer-form input[name=file]').click();
  }

 
});