import Backbone from 'backbone';
import template from '../templates/pcr_edits_view.hbs';
import {validateRDPSequence} from 'gentle-rdp/sequence_transform';

export default Backbone.View.extend({
  manage: true,
  template: template,

  initialize: function() {
    this.transforms = validateRDPSequence(this.model, false);
    console.log(this.transforms)
  }

});
