import Gentle from 'gentle';
import PCRView from './views/pcr_view';
import PcrProductSequence from './lib/product';
import WipPcrProductSequence from './lib/wip_product';
import PcrPrimer from '../pcr/lib/pcr_primer';
import HomePcrView from './views/home_pcr_view';
import SequenceModel from '../../sequence/models/sequence';
import SequencesCollection from '../../sequence/models/sequences';
import {version1GenericPreProcessor} from 'gentle-utils/preprocessor';


Gentle.addPlugin('sequence-primary-view', {
  name: 'pcr',
  title: 'PCR primers',
  view: PCRView,
  visible: (sequence) => {
    return Gentle.featureFlag('pcr') && sequence instanceof PcrProductSequence;
  },
  maximize: (sequence) => {
    return sequence instanceof WipPcrProductSequence;
  }
});

Gentle.addPlugin('sequence-canvas-context-menu', {
  name: 'pcr',
  title: 'Create RDP part',
  icon: 'wrench',
  selectionOnly: true,
  callback: function() {
    // `this` is the SequenceCanvas instance
    var sequenceView = this.view.parentView();
    var [selectionFrom, selectionTo] = this.selection;
    var argumentsForView = [{
      showForm: true,
    }, {
      selectionFrom: selectionFrom,
      selectionTo: selectionTo,
    }];
    sequenceView.changePrimaryView('pcr', true, argumentsForView);
  },
  visible: Gentle.featureFlag('pcr')
});

Gentle.addPlugin('home', {
  name: 'pcr',
  title: 'New RDP part',
  view: HomePcrView
});


var version1PcrProductPreProcessor = version1GenericPreProcessor('pcrProducts');
var version1forwardPrimerPreProcessor = version1GenericPreProcessor('forwardPrimer');
var version1reversePrimerPreProcessor = version1GenericPreProcessor('reversePrimer');

SequenceModel.registerPreProcessor(version1PcrProductPreProcessor);
SequenceModel.registerAssociation(PcrProductSequence, 'pcrProduct', true);
PcrProductSequence.registerPreProcessor(version1forwardPrimerPreProcessor);
PcrProductSequence.registerPreProcessor(version1reversePrimerPreProcessor);
PcrProductSequence.registerAssociation(PcrPrimer, 'forwardPrimer', false);
PcrProductSequence.registerAssociation(PcrPrimer, 'reversePrimer', false);
SequencesCollection.registerConstructor(PcrProductSequence, 'pcr_product');
SequencesCollection.registerConstructor(WipPcrProductSequence, 'wip_pcr_product');
