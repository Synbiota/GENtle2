define(function(require) {
  var Backbone = require('backbone.mixed'),
      template = require('hbars!../templates/statusbar_view'),
      StatusbarView;

  StatusbarView = Backbone.View.extend({
    manage: true,
    template: template,
    hasRendered: false,

    addSection: function(section) {
      var view = new section.view();
      view.parentView = this;
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