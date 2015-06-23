import Sequence from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';
import testAllSequenceModels from '../../library/sequence-model/tests/sequence_spec_mixin';

stubCurrentUser();
testAllSequenceModels(Sequence);
