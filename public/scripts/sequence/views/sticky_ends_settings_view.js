import Backbone from 'backbone';
import Gentle from 'gentle';
import template from '../templates/sticky_ends_settings_view.hbs';


export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'change input': 'onChange'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.onChange = _.throttle(_.bind(this.onChange, this), 250);
  },

  afterRender: function() {
    var stickyEnds = this.model.getStickyEnds();
    this.setFormData('start', stickyEnds.start);
    this.setFormData('end', stickyEnds.end);
  },

  getField: function(position, name) {
    return this.$(`#stickyEnd_${position}_${name}`);
  },

  getFormData: function(position) {
    return {
      enabled: this.getField(position, 'enabled').is(':checked'),
      name: this.getField(position, 'name').val(),
      reverse: this.getField(position, 'reverse').is(':checked'),
      size: this.getField(position, 'size').val()^0,
      offset: this.getField(position, 'offset').val()^0
    };
  },

  setFormData: function(position, stickyEnd) {
    if(stickyEnd) {
      this.getField(position, 'enabled').prop('checked', 'checked'); 
      this.getField(position, 'reverse').prop('checked', stickyEnd.reverse ? 'checked' : null);
      this.getField(position, 'name').val(stickyEnd.name);
      this.getField(position, 'size').val(stickyEnd.size);
      this.getField(position, 'offset').val(stickyEnd.offset);
    } else {
      this.getField(position, 'enabled').prop('checked', null); 
    }
  },

  onChange: function(event) {
    event.preventDefault();
    var data = {};
    var startData = this.getFormData('start');
    var endData = this.getFormData('end');

    var extract = function(data_) {
      return _.pick(data_, 'name', 'reverse', 'offset', 'size');
    };

    this.model.set('stickyEnds.start', startData.enabled ? extract(startData) : null);
    this.model.set('stickyEnds.end', endData.enabled ? extract(endData) : null);

    this.model.throttledSave();
    this.model.trigger('change:sequence');
  }

});