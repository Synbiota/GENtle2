import _ from 'underscore';
import Gentle from 'gentle';
import View from './views/sequencing_primers_view';
import SequenceModel from '../../sequence/models/sequence';
import SequencingProduct from './lib/product';
import SequenceRange from 'gentle-sequence-model/range';
import {version1GenericPreProcessor} from 'gentledna-utils/dist/preprocessor';


Gentle.addPlugin('sequence-primary-view', {
  name: 'sequencing_primers',
  title: 'RDP Sequencing primers',
  view: View,
  visible: Gentle.featureFlag('sequencingPrimers'),
});


/**
 * @function version0to1SequencingProductPreProcessor
 * Transforms data from:
 *     {
 *     meta: {
 *       sequencingPrimers: {
 *         products: [
 *           {
 *             from: 1,
 *             to: 9,
 *             antisense: false
 *             primer: {
 *               from: 3,
 *               to: 0,
 *               antisense: true,
 *               ...
 *             },
 *             ...
 *
 * To:
 *     {
 *     meta: {
 *       associations: {
 *         sequencingProducts: [
 *           {
 *             version: 1,
 *             range: {
 *               from: 1,
 *               size: 9,
 *               reverse: false
 *             },
 *             primer: {
 *               range: {
 *                 from: 1,
 *                 size: 3,
 *                 reverse: true,
 *               ...
 *
 *
 * @param  {Object} attributes
 * @return {Object}
 */
let version0to1SequencingProductPreProcessor = function(attributes) {
  if(_.isObject(attributes.meta) && _.isObject(attributes.meta.sequencingPrimers)) {
    attributes.meta.associations = attributes.meta.associations || {};
    attributes.meta.associations.sequencingProducts = _.map(attributes.meta.sequencingPrimers.products, function(product) {
      product.version = 1;
      product.range = SequenceRange.newFromOld(product, 'antisense', true);
      delete product.from;
      delete product.to;
      delete product.antisense;
      product.primer.range = SequenceRange.newFromOld(product.primer, 'antisense', true);
      delete product.primer.from;
      delete product.primer.to;
      delete product.primer.antisense;
      return product;
    });
    delete attributes.meta.sequencingPrimers;
  }
  return attributes;
};


var version1SequencingProductPreProcessor = version1GenericPreProcessor('sequencingProducts');

SequenceModel.registerPreProcessor(version0to1SequencingProductPreProcessor);
SequenceModel.registerPreProcessor(version1SequencingProductPreProcessor);
SequenceModel.registerAssociation(SequencingProduct, 'sequencingProduct', true);
