import Gentle from 'gentle';
import PCRView from './views/pcr_view';

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
