import Gentle from 'gentle';
import ChromatographView from './views/chromatograph_view';
import ChromatographSettingsView from './views/chromatograph_settings_view'

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
