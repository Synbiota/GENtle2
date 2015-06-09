import Gentle from 'gentle';
import View from './views/sequencing_primers_view';
import SequenceModel from '../../sequence/models/sequence';
import SequencingProduct from '../pcr/lib/product';


Gentle.addPlugin('sequence-primary-view', {
  name: 'sequencing_primers',
  title: 'Sequencing primers',
  view: View,
  visible: Gentle.featureFlag('sequencingPrimers'),
});


SequenceModel.registerAssociation(SequencingProduct, 'SequencingProduct', true);
