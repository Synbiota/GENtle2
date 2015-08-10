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
import RdpTypes from 'gentle-rdp/rdp_types';


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
    var Klass, primaryView, partType;
    if(Gentle.featureEnabled('rdp_oligo') && sequenceBases.length < 80) {
      Klass = WipRdpOligoSequence;
      primaryView = 'rdp_oligo';
      partType = RdpTypes.types.MODIFIER;
    } else {
      Klass = WipRdpPcrSequence;
      primaryView = 'rdp_pcr';
      partType = RdpTypes.types.CDS;
    }
    var name = loadedSequence.name + '-RDP';
    var sequence = new Klass({
      name: name,
      sequence: sequenceBases,
      displaySettings: {
        primaryView: primaryView
      },
      sourceSequenceName: loadedSequence.name,
      features: loadedSequence.features,
      partType,
    });

    Gentle.addSequencesAndNavigate([sequence]);
  },

});