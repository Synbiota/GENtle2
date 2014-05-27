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
define(function(require) {
  var Handlebars  = require('Handlebars.base'),
      _           = require('underscore.mixed');

  /**
  Displays select tag with options (and optional optgroups)
  @method select
  @param {Array or Object} context Array or Object of select options. Select options
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

  Handlebars.registerHelper('formatThousands', function(context, offset) {
    return _.formatThousands(context + (offset || 0));
  });

  Handlebars.registerHelper('shortFormNumber', function(context) {
    return _.shortFormNumber(context);
  });



  return Handlebars;
});