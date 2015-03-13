import $ from 'jquery';
import _ from 'underscore';

export default function draggableCleanup(context, ...selectors) {
  _.each(context.$(selectors.join(',')), function(el) {
    var $el = $(el);
    if($el.data('uiDraggable')) {
      $el.draggable('destroy');
    }

    if($el.data('uiDroppable')) {
      $el.droppable('destroy');
    }
  });
}