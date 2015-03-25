import TemporarySequence from '../../../sequence/models/temporary_sequence';
import stickyEnds from '../../../common/lib/sticky_ends';


var transformStickyEndData = function(stickyEndAttributes) {
  var newStickyEndAttributes;
  if(_.isString(stickyEndAttributes.start)) {
    // We're dealing with an old stickyEnd.  Try to transform it into the
    // new form
    var matchedStickyEnds = _.filter(stickyEnds, (stickyEnd) => {
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
      var {productSequence: productSequenceNts} = TemporarySequence.calculateSequence(sequenceNts, opts);
      productAttributes.sequence = productSequenceNts;
    }

    //Backwards compatibility.  Some of the pcr products were stored with incomplete stickyEnd data.
    productAttributes.stickyEnds = transformStickyEndData(productAttributes.stickyEnds);
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


// Testing
if(false) {
  var getOldStickyEndAttributes = function() {
    return {
      name: "X-Z'",
      startName: "X",
      endName: "Z'",
      start: "CCTGCAGTCAGTGGTCTCTAGAG",
      end: "GAGATGAGACCGTCAGTCACGAG",
      startOffset: 19,
      endOffset: -19
    };
  };
  var getExpectedStickyEndAttributes = function() {
    return {
      name: "X-Z'",
      start: {
        sequence: 'CCTGCAGTCAGTGGTCTCTAGAG',
        reverse: false,
        offset: 19,
        size: 4,
        name: "X",
      },
      end: {
        sequence: 'GAGATGAGACCGTCAGTCACGAG',
        reverse: true,
        offset: 19,
        size: 4,
        name: "Z'",
      }
    };
  };

  var transformedStickyEndData = transformStickyEndData(getOldStickyEndAttributes());
  console.assert(_.isEqual(transformedStickyEndData, getExpectedStickyEndAttributes()));
}


export default {getPcrProductsFromSequence, savePcrProductsToSequence};
