import Gentle from 'gentle';
import BlastView from './views/blast_view';

Gentle = Gentle();

Gentle.addPlugin('sequence-primary-view', {
  name: 'blast',
  title: 'Blast',
  view: BlastView
});