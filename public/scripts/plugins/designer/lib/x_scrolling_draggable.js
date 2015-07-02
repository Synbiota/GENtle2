import $ from 'jquery';
import _ from 'underscore';

var testPosition = function(element, left, top, right, bottom, options) {
  var scrollSensitivity = options.scrollSensitivity || 30;
  var scrollSpeed = options.scrollSpeed || 30;
  var {scrollPageX: pageX, scrollPageY: pageY} = options;

  if(pageY >= top && pageY <= bottom) {
    if(pageX >= left && pageX <= right) {
      if(pageX <= left + scrollSensitivity) {
        element.scrollLeft(element.scrollLeft() - scrollSpeed);
      } else if(pageX >= right - scrollSensitivity) {
        element.scrollLeft(element.scrollLeft() + scrollSpeed);
      }
    }
  }
  if(options.scrollTimeout) {
    options.scrollTimeout = setTimeout(() => {
      testPosition(element, left, top, right, bottom, options);
    }, 100);
  }
};

var onMouseMove = _.throttle(function(options, event) {
  options.scrollPageX = event.pageX;
  options.scrollPageY = event.pageY;
}, 100);

export default function xScrollingDraggable(element, options = {}) {
  element = $(element);
  _.defaults(options, {scroll: true});

  if(options.scroll) {

    var scrollingElement = $(options.scrollingElement);
    delete options.scrollingElement;

    var oldStart = options.start || function() {};
    var $document = $(document);
    var onMouseMovePartial = _.partial(onMouseMove, options);


    options.start = function(event, ui) {
      var {left, top} = scrollingElement.position();
      var right = left + scrollingElement.outerWidth(); 
      var bottom = top + scrollingElement.outerHeight(); 
      options.scrollTimeout = true;

      $document.on('mousemove', onMouseMovePartial);
      $document.one('mouseup', function() {
        $document.off('mousemove', onMouseMovePartial);
        if(options.scrollTimeout) {
          clearTimeout(options.scrollTimeout);
          delete options.scrollTimeout;
        }
      });
      testPosition(scrollingElement, left, top, right, bottom, options);
      oldStart(event, ui);
    };

    options.scroll = false;

    element.draggable(options);

  }

  return element;
};