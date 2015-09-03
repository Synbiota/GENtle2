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
import Modal from '../../../common/views/modal_view';
import OnboardingHelpView from './onboarding_help_view';

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
        this.displayOnboardingHelpModal(sequences[0]);
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

  displayOnboardingHelpModal: function(loadedSequence) {
    console.log('prout')
    if(loadedSequence.stickyEnds) {
      alert('The source sequence cannot already be an RDP part.');
      return;
    }

    var sequenceBases = loadedSequence.sequence;
    var sequenceLength = sequenceBases.length;

    if(Gentle.featureEnabled('rdp_oligo')) {

      if(sequenceLength >= 60 && sequenceLength <= 80) {
        Modal.show({
          title: 'New RDP Part',
          displayFooter: false,
          bodyView: new OnboardingHelpView({isUncertain: true})
        }).once('confirm', ({method}) => {
          this.createNewSequence(loadedSequence, method === 'oligo');
        });

      } else {
        let isOligo = sequenceBases.length < 80;

        if(OnboardingHelpView.shouldShowModal(isOligo)) {
          Modal.show({
            title: 'New RDP Part',
            displayFooter: false,
            bodyView: new OnboardingHelpView({isOligo, isUncertain: false})
          }).once('confirm', () => {
            this.createNewSequence(loadedSequence, isOligo);
          });
        } else {
          this.createNewSequence(loadedSequence, isOligo);
        }
      }
    } else {
      this.createNewSequence(loadedSequence, false);
    }
  },

  /**
   * @methode createNewSequence
   * @param  {Object} loadedSequence
   * @return {undefined}
   */
  createNewSequence: function(loadedSequence, isOligo) {
    var sequenceBases = loadedSequence.sequence;
    var sequenceLength = sequenceBases.length;
    var Klass, primaryView;

    if(isOligo) {
      Klass = WipRdpOligoSequence;
      primaryView = 'rdp_oligo';
    } else {
      Klass = WipRdpPcrSequence;
      primaryView = 'rdp_pcr';
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
    });

    Gentle.addSequencesAndNavigate([sequence]);
  },

});