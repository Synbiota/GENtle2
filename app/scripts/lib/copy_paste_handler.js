define(function(require) {
  var Q = require('q'),
      CopyPasteHandler;

  CopyPasteHandler = function() {
    this.copiedValue = undefined;
  };

  CopyPasteHandler.prototype.createBufferElement = function(callback) {
    var _this = this,
        $element = $('<textarea/>')
          .css({
            width: 1,
            height: 1,
            position: 'absolute',
            left: -10000
          });

    // We wait before removing the buffer
    setTimeout(function() {
      $element.remove();
    }, 200);

    // https://stackoverflow.com/questions/5797539/jquery-select-all-text-from-a-textarea/5797700#5797700
    $element.on('mouseup', function(event) {
        $element.off('mouseup');
        event.preventDefault();
    });

    $('body').append($element);
    $element.focus();

    // We wait for the value to be pasted in the buffer
    if(callback !== undefined) {
      if(this.copiedValue === undefined) {
        setTimeout(function() {
          callback.call(_this, $element.val());
        }, 20);
      } else {
        callback.call(_this, this.copiedValue);
      }
    }

    return $element;

  };

  CopyPasteHandler.prototype.fakeCopy = function(text) {
    this.copiedValue = text;
  };

  CopyPasteHandler.prototype.copy = function(text) {
    this.fakeCopy(text);
    this.createBufferElement().text(text).select();
  };

  CopyPasteHandler.prototype.paste = function() {
    var _this = this;
    return Q.promise(function(resolve) {

      _this.createBufferElement(function(text) {
        resolve(text);
      });

    });

  };

  return CopyPasteHandler;
});