import $ from 'jquery';

export default function drawLabel(sequenceCanvas, {
  feature, left, top, maxWidth
}) {
  var $label = $('<div/>')
    .addClass(`feature-label feature-type-${feature._type}`)
    .css({top, left, maxWidth})
    .text(feature.name);

  sequenceCanvas.$childrenContainer.append($label);

  return $label;
}