/**
@module Designer
@submodule Views
@class HomeDesignerView
**/
import _ from 'underscore';
import Backbone from 'backbone';
import template from '../templates/home_pcr_view.hbs';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import WipRdpPcrSequence from '../lib/wip_rdp_pcr_sequence';
import WipRdpOligoSequence from 'gentle-rdp/wip_rdp_oligo_sequence';
import Gentle from 'gentle';


export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'home-pcr',

  initialize: function() {
    this.onSequenceLoad = _.bind(this.onSequenceLoad, this);
  },

  events: {
    'submit .home-pcr-form': 'clickInputElement',
    'change .home-pcr-form input[name=file]': 'openSequenceFromFile'
  },

  clickInputElement: function(event) {
    event.preventDefault();
    this.$('.home-pcr-form input[name=file]').click();
  },

  openSequenceFromFile: function(event) {
    event.preventDefault();
    var $form     = this.$('.home-pcr-form').first(),
        input     = $form.find('input[name=file]')[0];

    var onError = function(filename) {
      alert('Could not load file ' + filename);
    };

    Filetypes.loadFile(input.files[0], true)
    .then(this.onSequenceLoad)
    .catch(onError)
    .done();
  },

  onSequenceLoad: function(result) {
    return Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name)
    .then((sequences) => {
      if ( sequences.length === 1 ) {
        this.createNewSequence(sequences[0]);
      } else{
       alert('Could not parse the sequence.');
      }
    })
    .catch(function(err) {
      console.log(err);
      alert('Could not parse the sequence.');
    })
    .done();
  },

  /**
   * @methode createNewSequence
   * @param  {Object} loadedSequence
   * @return {undefined}
   */
  createNewSequence: function(loadedSequence) {
    if(loadedSequence.stickyEnds) {
      alert('The source sequence cannot already be an RDP part.');
      return;
    }

    var sequenceBases = loadedSequence.sequence;
    var WipRdpClass, primaryView;
    if(Gentle.featureEnabled('rdp_oligo') && sequenceBases.length < 80) {
      WipRdpClass = WipRdpOligoSequence;
      primaryView = 'rdp_oligo';
    } else {
      WipRdpClass = WipRdpPcrSequence;
      primaryView = 'rdp_pcr';
    }
    var name = loadedSequence.name + '-RDP';
    var sequence = new WipRdpClass({
      name,
      sequence: sequenceBases,
      displaySettings: {primaryView},
      tryShowingModal: true,
      sourceSequenceName: loadedSequence.name,
      features: loadedSequence.features,
    });

    Gentle.addSequencesAndNavigate([sequence]);
  },

});