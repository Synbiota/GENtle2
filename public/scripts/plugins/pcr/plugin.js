import Gentle from 'gentle';
import PCRView from './views/pcr_view';
import PcrProductSequence from './lib/product';
import WipRdpPcrSequence from './lib/wip_rdp_pcr_sequence';
import RdpOligoSequence from 'gentle-rdp/rdp_oligo_sequence';
import WipRdpOligoSequence from 'gentle-rdp/wip_rdp_oligo_sequence';
import HomePcrView from './views/home_pcr_view';
import SequenceModel from '../../sequence/models/sequence';
import {version1GenericPreProcessor} from 'gentledna-utils/dist/preprocessor';


Gentle.addPlugin('sequence-primary-view', {
  name: 'rdp_pcr',
  title: 'RDP PCR primers',
  view: PCRView,
  visible: (sequence) => {
    return Gentle.featureEnabled('rdp_pcr') && sequence instanceof PcrProductSequence;
  },
  maximize: (sequence) => {
    return sequence instanceof WipRdpPcrSequence;
  }
});


Gentle.addPlugin('sequence-primary-view', {
  name: 'rdp_oligo',
  title: 'RDP oligo-based parts',
  view: PCRView,
  visible: (sequence) => {
    return Gentle.featureEnabled('rdp_oligo') && sequence instanceof RdpOligoSequence;
  },
  maximize: (sequence) => {
    return sequence instanceof WipRdpOligoSequence;
  }
});


// Gentle.addPlugin('sequence-canvas-context-menu', {
//   name: 'rdp',
//   title: 'Create RDP part',
//   icon: 'wrench',
//   selectionOnly: true,
//   callback: function() {
//     // `this` is the SequenceCanvas instance
//     var sequenceView = this.view.parentView();
//     var [selectionFrom, selectionTo] = this.selection;
//     var argumentsForView = [{
//       showForm: true,
//     }, {
//       selectionFrom: selectionFrom,
//       selectionTo: selectionTo,
//     }];
//     sequenceView.changePrimaryView('rdp_pcr', true, argumentsForView);
//   },
//   visible: Gentle.featureFlag('rdp')
// });

Gentle.addPlugin('home', {
  name: 'rdp',
  title: 'New RDP part',
  view: HomePcrView
});


var version1PcrProductPreProcessor = version1GenericPreProcessor('pcrProducts');

SequenceModel.registerPreProcessor(version1PcrProductPreProcessor);
SequenceModel.registerAssociation(PcrProductSequence, 'pcrProduct', true);
