var Handlebars = require('handlebars.mixed');

Handlebars.registerHelper('designer-draggable', function(sequence) {
  var template = require('../templates/designer_draggable_helper.hbs');

  var stickyEnds = _.mapObject(sequence.getStickyEnds(), (stickyEnd) => {
    return stickyEnd.name.replace(/[^\w]/g, '').toLowerCase();
  });

  return template({
    name: sequence.get('shortName') || sequence.get('name'),
    partType: sequence.get('partType') || '__default',
    id: sequence.get('id'),
    stickyEnds
  });
});
