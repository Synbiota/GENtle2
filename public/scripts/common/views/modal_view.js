import Backbone from 'backbone';
import template from '../templates/modal_view.hbs';
import _ from 'underscore';
import $ from 'jquery';

var defaultOptions = {
  displayFooter: true,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel'
};

var Modal = Backbone.View.extend({
  manage: true,
  template: template,
  className: 'modal master-modal',

  events: {
    'click .modal-confirm': 'confirm',
    'click .modal-cancel': 'cancel'
  },

  initialize() {
    _.bindAll(this, 'confirm', 'cancel');
  },

  show(options) {
    this.options = _.defaults(_.clone(options), defaultOptions);
    this.setView('.modal-body', this.options.bodyView);
    this.render();
    this.$el.modal('show').one('hide.bs.modal', this.cancel);
    return this;
  },

  hide(confirm) {
    this.$el.off('hide.bs.modal').modal('hide');
    this.removeView('.modal-body');
    this.trigger(confirm ? 'confirm' : 'cancel');
    this.off('confirm cancel');
    return this;
  },

  confirm(event) {
    if(event) event.preventDefault();
    this.hide(true);
  },

  cancel(event) {
    if(event) event.preventDefault();
    this.hide(false);
  },

  serialize() {
    return this.options;
  },

  afterRender() {
    var headerHeight = this.$('.modal-header').outerHeight();
    var footerHeight = this.$('.modal-footer').outerHeight();
    this.$('.modal-body').css({
      maxHeight: $(window).height() - 65 - headerHeight - footerHeight
    });
  }

});

export default new Modal();
