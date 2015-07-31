import $ from 'jquery';
import {isObject, each} from 'underscore';
import tooltip from 'tooltip';

$.fn.gentleTooltip = function(action, {content, ...otherOptions} = {}) {
  const $elem = $(this);

  if(isObject(action)) {
    $elem.gentleTooltip(null, action);
  }

  if($elem.length > 1) {
    each($elem, function(subElem) {
      $(subElem).gentleTooltip(action, {content, ...otherOptions});
    });
    return this;
  }

  if(!content) {
    content = $elem.attr('title');
  }

  switch(action) {
    case 'destroy': 
      tooltip.hide();
      $elem.off('.gentleTooltip');
      break;
    default: 
      $elem.on('mouseenter.gentleTooltip', function() {
        tooltip.show(content, otherOptions);
      }).on('mouseleave.gentleTooltip', function() {
        tooltip.hide();
      });
      break;
  }

  return this;
};