import template from './caret.html';
import _ from 'underscore';
import $ from 'jquery';

/**
@class Caret
@module Common
@constructor
@params {Object} options
@params {jQuery DOM Element} options.$container
@params {String} options.className
**/
class Caret {
  constructor(options) {
    this.$container = options.$container;
    this.className = options.className;
    this.blinking = !!options.blinking;

    _.bindAll(this, 'move',
                    'remove');

    this.createElement();
  }

  createElement() {
    var $element = $(template({
          className: this.className,
          blinking: this.blinking ? 'caret-blinking' : ''
        })).hide();

    this.$container.append($element);
    this.$element = $element;
  }

  move(posX, posY, base) {
    this.remove();
    this.posX = posX;
    this.posY = posY;
    this.base = base;
    this.$element
      .css({
        top: this.posY,
        left: this.posX
      })
      .show();
  }

  setInfo(text) { 
    this.$element.find(".caret-info").text(text);
  }

  remove() {
    this.$element.hide();
    this.posX = this.posY = this.base = undefined;
  }

  showHighlight() {
    this.$element.find(".caret-caret").css({background: "rgba(0,0,255,0.25)"});
  }

  hideHighlight() {
    this.$element.find(".caret-caret").css({background: "rgba(0,0,255,0)"});  
  };
}

export default Caret;