import tooltip from 'gentledna-utils/dist/tooltip';
import $ from 'jquery';

export default function hoverDescription($element) {
  $element.hover(
    function(event) {
      var description = $(event.currentTarget).data('description');
      if(description) tooltip.show(description, {delay: 500});
    },
    function() {
      tooltip.hide();
    }
  );
}