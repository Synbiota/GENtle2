import SequenceFeature from 'gentle-sequence-model/feature';


class RdpSequenceFeature extends SequenceFeature {
  constructor({sequence, contextualFrom, contextualTo}) {
    super(...arguments);
    this.sequence = sequence;
    this.contextualFrom = contextualFrom;
    this.contextualTo = contextualTo;
  }
}


export default RdpSequenceFeature;
