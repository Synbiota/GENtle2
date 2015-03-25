import TemporarySequence from '../../../sequence/models/temporary_sequence';


var getPcrProductsFromSequence = function(sequenceModel) {
  var attributesOfPcrProducts = sequenceModel.get('meta.pcr.products') || [];

  //Backwards compatibility.  Some of the pcr products were stored without the sequence attribute calculated.
  attributesOfPcrProducts = _.each(attributesOfPcrProducts, (productAttributes) => {
    if(!productAttributes.sequence) {
      var sequenceNts = sequenceModel.get('sequence');
      var opts = _.pick(productAttributes, ['from', 'to', 'stickyEnds']);
      var {productSequence: productSequenceNts} = TemporarySequence.calculateSequence(sequenceNts, opts);
      productAttributes.sequence = productSequenceNts;
    }
  });

  var products = _.map(attributesOfPcrProducts, (productAttributes) => new TemporarySequence(productAttributes));
  return products;
};


var savePcrProductsToSequence = function(sequenceModel, products) {
  // Originally the model attributes were just stored and handled as a hash,
  // we now want to use a model to handle them.
  // We call `stringify` then `parse`, to convert both vanilla hashes and
  // backbone models into vanilla hashes.
  var attributesOfPcrProducts = JSON.parse(JSON.stringify(products));
  return sequenceModel.set('meta.pcr.products', attributesOfPcrProducts).throttledSave();
};


export default {getPcrProductsFromSequence, savePcrProductsToSequence};
