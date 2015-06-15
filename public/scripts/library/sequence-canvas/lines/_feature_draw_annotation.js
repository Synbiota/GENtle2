import drawLabel from './_feature_draw_label';

export default function drawAnnotation(line, shape, {
  row, startX, deltaX, feature, i, y
}) {
  var sequenceCanvas = line.sequenceCanvas;
  var height = line.unitHeight - line.margin;

  shape.move(
    startX, 
    y
  );

  shape.rect(
    deltaX,
    line.unitHeight - line.margin
  ).addClass('event-region');
  
  shape.rect(
    deltaX, 
    line.lineSize
  );

  var $label = drawLabel(sequenceCanvas, {
    feature,
    top: y + 1,
    left: startX,
    maxWidth: deltaX
  });

  shape.rect(
    $label.outerWidth(),
    height
  ).backward();

}