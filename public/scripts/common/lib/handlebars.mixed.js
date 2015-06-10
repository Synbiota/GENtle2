/**
Handlebars helpers.

Hashes in arguments refer Handlebars' Hashes, e.g.:

```hbs
{{helperName context option1="1" option2="2"}}
                 ^^^^^^^^^^^ ^^^^^^^^^^^
```
@class Handlebars helpers
@module Utilities
**/
var Handlebars  = window.hb = require('hbsfy/runtime');
var _           = require('underscore');

/**
Displays select tag with options (and optional optgroups)
@method select
@param {Array or objects} context Array or Object of select options. Select options
  are objects with a `name` and `value` property. If passed an Object, keys
  are used as `optgroup` labels and values should be arrays of select options.
@param {Hash} options Possible options:

  * `id`
  * `name`
  * `class`
  * `selected`

**/
Handlebars.registerHelper('select', function(context, options) {
  var addOption, addOptions,
      output = '';

  addOption = function(name, value, selected) {
    return  '<option value="' + value + '"'+
            (value == selected ? ' selected="selected"' : '') +
            '>' + name + '</option>';
  };

  addOptions = function(_options, selected) {
    return _.map(_options, function(option) {
      return addOption(option.name, option.value, selected);
    }).join('');
  };

  output += '<select id="' + options.hash.id + '" name="' +
            options.hash.name + '" class="' + options.hash.class + '">';

  if(_.isArray(context)) {
    output += addOptions(context, options.hash.selected);
  } else {
    _.forEach(context, function(_options, optgroupName) {
      output += '<optgroup label="' + optgroupName +'">';
      output += addOptions(_options, options.hash.selected);
      output += '</optgroup>';
    });
  }

  output += '</select>';

  return output;
});

var formatThousands = function(context, offset) {
  return _.formatThousands(context + (_.isObject(offset) ? 0 : offset));
};

Handlebars.registerHelper('formatThousands', function(context, offset) {
  return formatThousands(context, offset);
});

Handlebars.registerHelper('sequenceLength', function(sequenceModel) {
  var length = 0;
  if(_.isString(sequenceModel)) {
    length = sequenceModel.length;
  } else if(_.isObject(sequenceModel)) {
    if(_.isString(sequenceModel.sequence)) {
      length = sequenceModel.sequence.length;
    } else if(_.isFunction(sequenceModel.length)) {
      length = sequenceModel.getLength();
    } else if(_.isFunction(sequenceModel.getLength)) {
      length = sequenceModel.getLength(sequenceModel.STICKY_END_FULL);
    }
  }
  return formatThousands(length, 0);
});

Handlebars.registerHelper('plus', function(number, offset) {
  return number + offset;
});

Handlebars.registerHelper('shortFormNumber', function(context) {
  return _.shortFormNumber(context);
});

/**
If conditionals with union
@method Handlebars##ifOr
**/
Handlebars.registerHelper('ifOr', function() {
  var args = _.toArray(arguments),
      options = args.pop(),
      isTrue;

  isTrue =  _.some(
              _.map(args, function(arg) {
                return _.isFunction(arg) ? arg.call(this) : arg;
              })
            );

  if (!isTrue) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }

});

Handlebars.registerHelper('pluralize', function(number, singular, plural) {
  return number === 1 ?
    singular :
    (typeof plural === 'string' ? plural : singular + 's');
});

Handlebars.registerHelper('pluralCount', function(number, singular, plural) {
  return number + ' ' + Handlebars.helpers.pluralize.apply(this, arguments);
});

Handlebars.registerHelper('round', function(number, precision, isPercentage) {
  isPercentage = _.isBoolean(isPercentage) && isPercentage;
  return (number * (isPercentage ? 100 : 1)).toFixed(precision) ;
});


Handlebars.registerHelper('sequenceFastAExportButton', function(sequenceID) {
  var exportFastATemplate = require('../templates/export_fasta.hbs');
  return exportFastATemplate({sequenceID});
});

Handlebars.registerHelper('sequenceClipboardExportButton', function(sequenceID) {
  var exportClipboardTemplate = require('../templates/export_clipboard.hbs');
  return exportClipboardTemplate({sequenceID});
});

Handlebars.registerHelper('displaySequence', function(sequence) {
  var displaySequenceTemplate = require('../templates/display_sequence.hbs');
  return displaySequenceTemplate({sequence});
});

Handlebars.registerHelper('displaySelectableSequence', function(sequenceModel) {
  var displaySelectableSequenceTemplate = require('../templates/display_selectable_sequence.hbs');
  var sequence = sequenceModel;
  if(_.isObject(sequenceModel) && _.isFunction(sequenceModel.getSequence)) {
    sequence = sequenceModel.getSequence(sequenceModel.STICKY_END_FULL);
  }
  return displaySelectableSequenceTemplate({sequence});
});


module.exports = Handlebars;