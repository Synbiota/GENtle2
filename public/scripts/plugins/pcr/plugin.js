import Gentle from 'gentle';
import PCRView from './views/pcr_view';

Gentle.addPlugin('sequence-primary-view', {
  name: 'pcr',
  title: 'PCR Product',
  view: PCRView
});

Gentle.addPlugin('sequence-canvas-context-menu', {
  name: 'pcr',
  title: 'Create PCR product',
  icon: 'wrench',
  selectionOnly: true,
  callback: function() {
    // `this` is the SequenceCanvas instance
    var sequenceView = this.view.parentView();
    var [selectionFrom, selectionTo] = this.selection;
    sequenceView.changePrimaryView('pcr');
    sequenceView.actualPrimaryView.updateRange(selectionFrom, selectionTo);
  }
});
