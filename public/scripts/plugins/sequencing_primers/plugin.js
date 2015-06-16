import Gentle from 'gentle';
import View from './views/sequencing_primers_view';

Gentle.addPlugin('sequence-primary-view', {
  name: 'sequencing_primers',
  title: 'Sequencing primers',
  view: View,
  visible: Gentle.featureFlag('sequencingPrimers')
});