import _ from 'underscore';
import allStickyEnds from '../../../common/lib/sticky_ends';
import RdpTypes from 'gentle-rdp/rdp_types';


var transformStickyEndData = function(stickyEndAttributes) {
  var newStickyEndAttributes;
  if(_.isString(stickyEndAttributes.start)) {
    // We're dealing with an old stickyEnd.  Try to transform it into the
    // new form
    var matchedStickyEnds = _.filter(allStickyEnds(), (stickyEnd) => {
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
  return sequenceModel.get('pcrProducts') || [];
};


var savePcrProductsToSequence = function(sequenceModel, products = []) {
  if(!_.isArray(products)) throw `Expected an array: ${JSON.stringify(products)}`;

  var attributesOfPcrProducts = _.map(products, function(product) {
    // Originally the model attributes were just stored and handled as an object,
    // we now want to use a model to handle them.
    // We use Backbone's toJSON to convert backbone models into vanilla objects.
    return (product.toJSON && product.toJSON()) || product;
  });
  return sequenceModel.set('pcrProducts', attributesOfPcrProducts).throttledSave();
};


var stickyEndNames = {};
_.chain(allStickyEnds()).pluck('name').each((val) => stickyEndNames[val] = val);
var rdpTypes = {};
rdpTypes[RdpTypes.types.CDS] =           'Fusion protein CDS';
rdpTypes[RdpTypes.types.CDS_WITH_STOP] = 'CDS with stop';
rdpTypes[RdpTypes.types.RBS] =           RdpTypes.types.RBS;
const rdpLabels = _.extend({}, rdpTypes, stickyEndNames);

/**
 * @function humaniseRdpLabel
 * @param  {String} partTypeOrStickyEnd  An RDP sticky end or part type name
 * @return {String}
 */
var humaniseRdpLabel = function(partTypeOrStickyEnd) {
  var humanisedName = _.has(rdpLabels, partTypeOrStickyEnd) ? rdpLabels[partTypeOrStickyEnd] : _.ucFirst(partTypeOrStickyEnd, true);
  return humanisedName.replace(/_/g, ' ');
};



export default {
  getPcrProductsFromSequence,
  savePcrProductsToSequence,
  humaniseRdpLabel,
  // exposed for testing.
  transformStickyEndData,
};
