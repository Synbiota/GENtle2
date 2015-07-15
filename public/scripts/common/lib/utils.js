import Backbone from 'backbone.mixed';
import Filetypes from './filetypes/filetypes';
import Sequence from '../../sequence/models/sequence';


export function getProductAndSequenceForSequenceID (products, sequenceID) {    
  // TODO: remove this PCR plugin specific code.
  var fields = ['forwardPrimer', 'reversePrimer'];
  var sequence;
  var product = _.find(products, function(product) {
    _.each(fields, function(field) {
      var _sequence = product.attributes[field];
      if(!sequence && _sequence && _sequence.id && _sequence.id === sequenceID) sequence = _sequence;
    });
    return sequence; // if `sequence` is found, stops find loop with matching `product`
  });
  return sequence ? {product, sequence} : undefined;
}


export function fastAExportSequence ({product, sequence}) {
  Filetypes.exportToFile('fasta', (new Sequence({
    sequence: sequence.sequence,
    name: product.name + ' - ' + sequence.name,
  })).toJSON());
}


export function fastAExportSequenceFromID (products, sequenceID){
  var result = getProductAndSequenceForSequenceID(products, sequenceID);
  if(result) fastAExportSequence(result);
}


export function naiveReverseString (string) {
  // Use this library for unicode strings with special chars
  // https://github.com/mathiasbynens/esrever
  return string.split("").reverse().join("");
}


export function makeOptions(context, options={}) {
  var output = '';
  options.hash = options.hash || {};

  var addOption = function(name, value, selectedValue) {
    var selected = ((value === selectedValue) ? ' selected="selected"' : '');
    return `<option value="${value}" ${selected}>${name}</option>`;
  };

  var addOptions = function(_options, selectedValue) {
    return _.map(_options, function(option) {
      return addOption(option.name, option.value, selectedValue);
    }).join('');
  };

  if(_.isArray(context)) {
    output += addOptions(context, options.hash.selected);
  } else {
    _.forEach(context, function(_options, optgroupName) {
      output += '<optgroup label="' + optgroupName +'">';
      output += addOptions(_options, options.hash.selected);
      output += '</optgroup>';
    });
  }
  return output;
}
