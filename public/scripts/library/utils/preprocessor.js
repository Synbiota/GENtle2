import _ from 'underscore';


/**
 * @function version1GenericPreProcessor
 *
 * returns a function that transforms data (from server) from:
 *     {
 *     meta: {
 *       associations: {
 *         `fieldName`: [...
 *
 * To:
 *     {
 *     `fieldName`: [...
 *
 * @param  {String} fieldName
 * @return {Function}  Takes `param {Object} attributes` and returns
 *                     {Object} newAttributes
 */
var version1GenericPreProcessor = function(fieldName) {
  var preProcessor = function(attributes) {
    if(_.isObject(attributes.meta) && 
       _.isObject(attributes.meta.associations) && 
       attributes.meta.associations[fieldName]) {
      attributes[fieldName] = attributes.meta.associations[fieldName];
      delete attributes.meta.associations[fieldName];
      if(!_.keys(attributes.meta.associations).length) delete attributes.meta.associations;
      if(!_.keys(attributes.meta).length) delete attributes.meta;
    }
    return attributes;
  };
  return preProcessor;
};


export default {
  version1GenericPreProcessor
};
