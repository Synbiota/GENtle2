import PcrProductSequence from '../../plugins/pcr/lib/product';


class RdpSequence extends PcrProductSequence {
  constructor(attrs, ...args) {
    // TODO refactor
    try {
      var rdpEdits = attrs.meta.associations.rdpEdits || attrs.rdpEdits;
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
      'sourceSequenceName',
      'shortName',
      'partType',
      'rdpEdits',
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


export default RdpSequence;
