import Gentle from 'gentle';
import SequenceModel from '../../sequence/models/sequence';
import ChromatographView from './views/chromatograph_view';
import ChromatographSettingsView from './views/chromatograph_settings_view'
import ChromatogramFragment from './lib/chromatogram_fragment.js'
import {version1GenericPreProcessor} from 'gentledna-utils/dist/preprocessor';


Gentle.addPlugin('sequence-primary-view', {
  name: 'chromatograph',
  title: 'Chromatograph',
  view: ChromatographView,
  visible: Gentle.featureFlag('chromatograph')
});

Gentle.addPlugin('sequence-settings-tab', {
  name: 'addChromtograph',
  title: 'Add Chromatograph',
  icon: 'align-left',
  view: ChromatographSettingsView,
  visible: function() {
    return this.sidebarView.parentView().primaryView.name == 'chromatograph'
  }
})

var version1PcrProductPreProcessor = version1GenericPreProcessor('chromatogramFragments');

SequenceModel.registerPreProcessor(version1PcrProductPreProcessor);

SequenceModel.registerAssociation(ChromatogramFragment, 'chromatogramFragment', true);
