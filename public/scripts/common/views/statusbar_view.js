define(function(require) {
  var Backbone = require('backbone'),
      template = require('../templates/statusbar_view.hbs'),
      StatusbarView;

  StatusbarView = Backbone.View.extend({
    manage: true,
    template: template,
    hasRendered: false,

    addSection: function(section) {
      var view = new section.view();
      this.sections[section.name] = section;
      this.setView('.statusbar-section-outlet-'+section.name+'', view);
      if(this.hasRendered) this.render();
    },

    getVisibleSections: function(section) {
      return _.filter(this.sections, function(section) {
        return section.visible === undefined || section.visible();
      });
    },

    serialize: function() {
      this.hasRendered = true;
      return {
        sections: this.getVisibleSections()
      };
    }

  });

  return StatusbarView;
});