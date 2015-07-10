import template from './tooltip_template.html';
import $ from 'jquery';
import _ from 'underscore';

class Tooltip {
  constructor() {
    this.$el = $(template({}));
    _.bindAll(this, 'move');
  }

  insert() {
    $('body').append(this.$el);
  }

  show(text, options = {}) {
    var $el = this.$el;

    var {delay, newClasses} = _.defaults(options, {
      delay: 0
    });
    
    $el.html(text)
      .removeClass(this.previousClasses)
      .addClass(newClasses);

    this.timeout = setTimeout(() => {
      $el.removeClass('gentle-tooltip-hidden');
      delete this.timeout;
    }, delay);

    $('body').on('mousemove', this.move);

    this.previousClass = newClasses;
  }

  hide() {
    this.$el.addClass('gentle-tooltip-hidden');

    if(this.timeout) {
      clearTimeout(this.timeout);
      delete this.timeout;
    }

    $('body').off('mousemove', this.move);
  }

  move(event) {
    var {$el} = this;
    var {pageX: mouseX, pageY: mouseY} = event;
    // this.switchOrientation(event.pageX, event.pageY);
    window.requestAnimationFrame(() => {
      var height = $el.outerHeight();
      var width = $el.outerWidth();
      var $window = $(window);
      var top, left;

      if(mouseY + height + 15 > $window.height()) {
        top = mouseY - height - 10;
      } else {
        top = mouseY + 10;
      }

      if(mouseX + width + 15 > $window.width()) {
        left = mouseX - width - 10;
      } else {
        left = mouseX + 10;
      }

      $el.css({top, left});
    });
  }
}

export default new Tooltip();