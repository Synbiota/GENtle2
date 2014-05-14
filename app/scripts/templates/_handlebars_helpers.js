define(function(require) {
  var Handlebars = require('Handlebars');

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

  return Handlebars;
});