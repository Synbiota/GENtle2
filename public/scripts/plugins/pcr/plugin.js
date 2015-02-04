import Gentle from 'gentle';
import PCRView from './views/pcr_view';

Gentle = Gentle();

Gentle.addPlugin('sequence-primary-view', {
  name: 'pcr',
  title: 'PCR mode',
  view: PCRView
});