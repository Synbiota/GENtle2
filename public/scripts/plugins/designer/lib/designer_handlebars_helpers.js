var Handlebars = require('handlebars.mixed');

Handlebars.registerPartial('designer-draggable', require('../templates/designer_draggable_helper.hbs'));

// Handlebars.registerHelper('designer-draggable', function(options) {
//   var template = require('../templates/designer_draggable_helper.hbs');
//   return template(options.hash);
// });
