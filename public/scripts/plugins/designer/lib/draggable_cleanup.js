import $ from 'jquery';
import _ from 'underscore';

export default function draggableCleanup(context, ...selectors) {
  _.each(context.$(selectors.join(',')), function(el) {
    var $el = $(el);
    if($el.data('ui-draggable')) {  // DO NOT EDIT to ui_draggable.  'ui-draggable' used by jquery-ui library
      $el.draggable('destroy');
    }

    if($el.data('ui-droppable')) {  // DO NOT EDIT to ui_draggable.  'ui-draggable' used by jquery-ui library
      $el.droppable('destroy');
    }
  });
}