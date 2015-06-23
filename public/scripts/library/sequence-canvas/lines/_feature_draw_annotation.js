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
  
  // Draw thin line for full length of annotation
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

  return shape.rect(
    $label.outerWidth(),
    height
  ).backward();

}