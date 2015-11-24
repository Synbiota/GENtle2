import Backbone from 'backbone';
import _ from 'underscore';
import template from '../templates/designer_edit_name_modal_view.hbs';

export default Backbone.View.extend({
  manage: true,
  template: template,
  changeName: function(name){
    console.log(arguments)
  },
  serialize: function() {
    return {
      name: this.model.get('name')
    };
  }
});
