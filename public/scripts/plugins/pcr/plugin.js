import Gentle from 'gentle';
import PCRView from './views/pcr_view';
import PcrProductSequence from './lib/product';
import PcrPrimer from '../pcr/lib/pcr_primer';
import SequenceModel from '../../sequence/models/sequence';
import {version1GenericPreProcessor} from '../utils';


Gentle.addPlugin('sequence-primary-view', {
  name: 'pcr',
  title: 'RDP part designer',
  view: PCRView,
  visible: Gentle.featureFlag('pcr')
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


var version1PcrProductPreProcessor = version1GenericPreProcessor('pcrProducts');

SequenceModel.registerPreProcessor(version1PcrProductPreProcessor);
SequenceModel.registerAssociation(PcrProductSequence, 'pcrProduct', true);
PcrProductSequence.registerAssociation(PcrPrimer, 'forwardPrimer', false);
PcrProductSequence.registerAssociation(PcrPrimer, 'reversePrimer', false);
