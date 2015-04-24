import TemporarySequence from '../../../sequence/models/temporary_sequence';
import stickyEnds from '../../../common/lib/sticky_ends';
import _ from 'underscore';


var transformStickyEndData = function(stickyEndAttributes) {
  var newStickyEndAttributes;
  if(_.isString(stickyEndAttributes.start)) {
    // We're dealing with an old stickyEnd.  Try to transform it into the
    // new form
    var matchedStickyEnds = _.filter(stickyEnds(), (stickyEnd) => {
      return (
        stickyEnd.start.sequence === stickyEndAttributes.start &&
        stickyEnd.end.sequence === stickyEndAttributes.end &&
        stickyEnd.start.offset === stickyEndAttributes.startOffset &&
        stickyEnd.end.offset === (-stickyEndAttributes.endOffset)
      );
    });
    if(matchedStickyEnds.length !== 1) {
      throw `Could not transform old stickyEnd into new. "${JSON.stringify(stickyEndAttributes)}"  did not match 1 and only 1 sticky ends.  "${JSON.stringify(matchedStickyEnds)}"`;
    } else {
      newStickyEndAttributes = _.deepClone(matchedStickyEnds[0]);
    }
  } else {
    newStickyEndAttributes = stickyEndAttributes;
  }
  return newStickyEndAttributes;
};


var getPcrProductsFromSequence = function(sequenceModel) {
  var attributesOfPcrProducts = sequenceModel.get('meta.pcr.products') || [];

  attributesOfPcrProducts = _.each(attributesOfPcrProducts, (productAttributes) => {
    //Backwards compatibility.  Some of the pcr products were stored without the sequence attribute calculated.
    if(!productAttributes.sequence) {
      var sequenceNts = sequenceModel.get('sequence');
      var opts = _.pick(productAttributes, ['from', 'to', 'stickyEnds']);
      var {productSequence: productSequenceNts} = TemporarySequence.calculateProduct(sequenceNts, opts);
      productAttributes.sequence = productSequenceNts;
    }

    //Backwards compatibility.  Some of the pcr products were stored with incomplete stickyEnd data.
    productAttributes.stickyEnds = transformStickyEndData(productAttributes.stickyEnds);
    productAttributes._type = 'pcr_product';
  });

  var products = _.map(attributesOfPcrProducts, (productAttributes) => new TemporarySequence(productAttributes));

  // if(products.length) debugger
  return products;
};


var savePcrProductsToSequence = function(sequenceModel, products = []) {
  if(!_.isArray(products)) throw `Expected an array: ${JSON.stringify(products)}`;

  var attributesOfPcrProducts = _.map(products, function(product) {
    // Originally the model attributes were just stored and handled as a hash,
    // we now want to use a model to handle them.
    // We use Backbone's toJSON to convert both the vanilla hashes and
    // backbone models into vanilla hashes.
    return (product.toJSON && product.toJSON()) || product;
  });

  return sequenceModel.set('meta.pcr.products', attributesOfPcrProducts).throttledSave();
};


export default {
  getPcrProductsFromSequence,
  savePcrProductsToSequence,
  transformStickyEndData, // exposed for testing.
};
