import Backbone from 'backbone';
import Gentle from 'gentle';
import template from '../templates/statusbar_primary_view_view.hbs';

export default Backbone.View.extend({
  template: template,
  manage: true,

  events: {
    'click #primary-view-list a': 'changePrimaryView'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.listenTo(this.model, 'change:displaySettings.primaryView', this.render, this);
  },

  serialize: function() {
    var parentView = this.parentView(2);

    return {
      readOnly: !!Gentle.currentSequence.get('readOnly'),
      primaryView: parentView.primaryView.title,
      primaryViews: _.filter(parentView.primaryViews, function(view) {
        return _.isUndefined(view.visible) || view.visible();
      })
    };
  },

  changePrimaryView: function(event) {
    event.preventDefault();
    var primaryViewName = this.$(event.currentTarget).data('section_name');
    this.parentView(2).changePrimaryView(primaryViewName, true);
  }
});