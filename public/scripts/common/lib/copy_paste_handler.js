import Q from 'q';

export default class {
  constructor() {
    this.copiedValue = undefined;
  }

  createBufferElement(callback) {
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
      // if(this.copiedValue === undefined) {
        setTimeout(function() {
          callback.call(_this, $element.val());
        }, 20);
      // } else {
      //   callback.call(_this, this.copiedValue);
      // }
    }

    return $element;

  }

  fakeCopy(text) {
    this.copiedValue = text;
  }

  copy(text) {
    // this.fakeCopy(text);
    this.createBufferElement().text(text).select();
  }

  paste() {
    return Q.promise((resolve) => {
      this.createBufferElement(function(text) {
        resolve(text);
      });
    });

  }
}
