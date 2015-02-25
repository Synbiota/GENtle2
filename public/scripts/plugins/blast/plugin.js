import Gentle from 'gentle';
import BlastView from './views/blast_view';

Gentle.addPlugin('sequence-primary-view', {
  name: 'blast',
  title: 'BLAST',
  view: BlastView
});