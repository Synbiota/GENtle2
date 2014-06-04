/**
@class Caret
@module Common
@constructor
@params {Object} options
@params {jQuery DOM Element} options.$container
@params {String} options.className
**/
define(function(require) {
  var template = require('hbars!../templates/caret'),
      Caret;

  Caret = function(options) {
    this.$container = options.$container;
    this.className = options.className;
    this.blinking = !!options.blinking;

    _.bindAll(this, 'move',
                    'remove');

    this.createElement();
  };

  Caret.prototype.createElement = function() {
    var $element = $(template({
          className: this.className,
          blinking: this.blinking
        })).hide();

    this.$container.append($element);
    this.$element = $element;
  };

  Caret.prototype.move = function(posX, posY, base) {
    this.remove();
    this.posX = posX;
    this.posY = posY;
    this.base = base;
    this.$element
      .css({
        top: this.posY,
        left: this.posX
      })
      .show()
      .find('.caret-info').text(_.formatThousands(base+1));
  };

  Caret.prototype.remove = function() {
    this.$element.hide();
    this.posX = this.posY = this.base = undefined;
  };

  return Caret;
});