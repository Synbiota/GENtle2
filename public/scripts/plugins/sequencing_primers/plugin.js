import Gentle from 'gentle';
import View from './views/sequencing_primers_view';
import SequenceModel from '../../sequence/models/sequence';
import SequencingProduct from './lib/product';
import SequenceRange from '../../library/sequence-model/range';


Gentle.addPlugin('sequence-primary-view', {
  name: 'sequencing_primers',
  title: 'Sequencing primers',
  view: View,
  visible: Gentle.featureFlag('sequencingPrimers'),
});


/**
 * @function version0to1PreProcessor
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
 *         SequencingProducts: [
 *           {
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
let version0to1PreProcessor = function(attributes) {
  if(_.isObject(attributes.meta) && _.isObject(attributes.meta.sequencingPrimers)) {
    attributes.meta.associations = attributes.meta.associations || {};
    attributes.meta.associations.SequencingProducts = _.map(attributes.meta.sequencingPrimers.products, function(product) {
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


/**
 * @function version1PreProcessor
 *
 * Transforms data from:
 *     {
 *     meta: {
 *       associations: {
 *         SequencingProducts: [...
 *
 * To:
 *     {
 *     SequencingProducts: [...
 *
 * @param  {Object} attributes
 * @return {Object}
 */
let version1PreProcessor = function(attributes) {
  if(_.isObject(attributes.meta) && 
     _.isObject(attributes.meta.associations) && 
     attributes.meta.associations.SequencingProducts) {
    attributes.SequencingProducts = attributes.meta.associations.SequencingProducts;
    delete attributes.meta.associations.SequencingProducts;
    if(!_.keys(attributes.meta.associations).length) delete attributes.meta.associations;
    if(!_.keys(attributes.meta).length) delete attributes.meta;
  }
  return attributes;
};


SequenceModel.registerAssociation(SequencingProduct, 'SequencingProduct', true);
SequenceModel.registerPreProcessor(version0to1PreProcessor);
SequenceModel.registerPreProcessor(version1PreProcessor);
