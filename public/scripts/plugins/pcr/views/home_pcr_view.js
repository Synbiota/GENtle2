/**
@module Designer
@submodule Views
@class HomeDesignerView
**/
import Backbone from 'backbone';
import template from '../templates/home_pcr_view.hbs';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import WipPcrProductSequence from '../lib/wip_product';
import Gentle from 'gentle';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'home-pcr',

  events: {
    'submit .home-pcr-form': 'clickInputElement',
    'change .home-pcr-form input[name=file]': 'openSequenceFromFile'
  },
  
  createNewSequence: function(event, loadedSequence) {
    event.preventDefault();
    var name = loadedSequence.name + '-RDP';
    var sequence = new WipPcrProductSequence({
      name: name,
      sequence: loadedSequence.sequence,
      displaySettings: {
        primaryView: 'rdp_pcr'
      },
      sourceSequenceName: loadedSequence.name,
    });

    Gentle.addSequencesAndNavigate([sequence]);
  },

  openSequenceFromFile: function(event) {
    event.preventDefault();
    var $form     = this.$('.home-pcr-form').first(),
        input     = $form.find('input[name=file]')[0];

    var onLoad = (result) => {
      return Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name).then((sequences) => {
        if ( sequences.length === 1 ) {
          this.createNewSequence(event, sequences[0]);
        } else{
         alert('Could not parse the sequence.');
        }
      }, function (err) {
        console.log(err);
        alert('Could not parse the sequence.');
      }).done();
    };

    var onError = function(filename) {
      alert('Could not load file ' + filename);
    };

    Filetypes.loadFile(input.files[0], true).then(onLoad, onError).done();

  },

  clickInputElement: function(event) {
    event.preventDefault();
    this.$('.home-pcr-form input[name=file]').click();
  }

 
});