define(function(require) {
  var Backbone = require('backbone.mixed'),
      _ = require('underscore.mixed'),
      template = require('../templates/restriction_enzymes_settings_list_view.hbs');

  return Backbone.View.extend({
    template: template,
    manage: true,

    events: {
      'change input': 'updateDisplaySettings'
    },

    populate: function() {
      var _this = this,
          selected = this.model.get('displaySettings.rows.res.custom');

      _.each(selected, function(enzymeName) {
        _this.$('input[value="'+enzymeName+'"]').attr('checked', 'checked');
      });
    },

    afterRender: function() {
      this.populate();
    },

    serialize: function() {
      return {
        enzymes: this.parentView().getEnzymes()
      };
    }
  });
});