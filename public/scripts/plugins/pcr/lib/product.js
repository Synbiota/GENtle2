import Sequence from '../../../sequence/models/sequence';


class PcrProductSequence extends Sequence {
  constructor(attrs, ...args) {
    try {
      var rdpEdits = attrs.meta.associations.rdpEdits;
      delete attrs.meta.associations.rdpEdits;
      attrs.rdpEdits = rdpEdits;
    } catch(e) {} finally {
      super(attrs, ...args);
      this.set('_type', 'pcr_product', {silent: true});  
    }
  }

  get requiredFields() {
    return super.requiredFields.concat([
      'forwardPrimer',
      'reversePrimer',
      'stickyEnds',
      'partType',
      'rdpEdits'
    ]);
  }

  toJSON() {
    var attributes = super.toJSON();
    var rdpEdits = attributes.rdpEdits;
    delete attributes.rdpEdits;
    attributes.meta.associations.rdpEdits = rdpEdits;
    return attributes;
  }
}


export default PcrProductSequence;
