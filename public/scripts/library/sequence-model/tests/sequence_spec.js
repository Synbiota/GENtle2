import sequenceModelFactory from '../factory';
import Backbone from 'backbone';
import testAllSequenceModels from './sequence_spec_mixin';

// Todo – test with Backbone.Model instead of Backbone.DeepModel
var Sequence = sequenceModelFactory(Backbone.DeepModel);

testAllSequenceModels(Sequence);
