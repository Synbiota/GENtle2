import drawJaggedArrow from './_jagged_arrow';
import drawLabel from './_feature_draw_label';
import $ from 'jquery';

export default function drawAnnotation(line, shape, {
  row, startX, deltaX, feature, i, y, baseRange, range, rangeFrom, rangeTo
}) {

  var sequenceCanvas = line.sequenceCanvas;
  var height = line.unitHeight - line.margin;

  var arrowY = y + line.unitHeight / 2;
  var arrowStartX = startX;
  var arrowEndX = startX + deltaX;
  var reverse = range.reverseComplement;

  var continuingBefore = rangeFrom < baseRange[0];
  var continuingAfter = rangeTo > baseRange[1];

  if(reverse) {
    [arrowStartX, arrowEndX] = [arrowEndX, arrowStartX];
    [continuingAfter, continuingBefore] = [continuingBefore, continuingAfter];
  }

  if(continuingBefore) {
    arrowStartX += reverse ? 5 : -5;
  }

  if(continuingAfter) {
    arrowEndX += reverse ? -5 : 5;
  }

  var arrow = drawJaggedArrow(shape, {
    fromX: arrowStartX, 
    fromY: arrowY, 
    toX: arrowEndX, 
    toY: arrowY, 
    width: height, 
    arrowLength: 5,
    jaggedStart: continuingBefore,
    jaggedEnd: continuingAfter
  });

  var textOffsetLeft = reverse && !continuingAfter ? 4 : 0;
  var textOffsetRight = !reverse && !continuingAfter ? 4 : 0;

  drawLabel(sequenceCanvas, {
    feature,
    top: y + 2,
    left: startX + textOffsetLeft,
    maxWidth: deltaX - textOffsetLeft - textOffsetRight
  });

  return arrow;
}