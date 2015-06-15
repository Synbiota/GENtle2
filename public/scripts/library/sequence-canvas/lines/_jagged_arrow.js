const defaultJagLength = 3;
const defaultJagNumber = 2;

export default function drawJaggedArrow(shape, {
    fromX, 
    fromY, 
    toX, 
    toY, 
    width, 
    arrowLength, 
    arrowWidth = width, 
    jaggedStart,
    jaggedEnd,
    jagLength = defaultJagLength,
    jagNumber = defaultJagNumber
  }) {

  var jagIncY = width / jagNumber / 2;
  var length = Math.sqrt(Math.pow(toY - fromY, 2) + Math.pow(toX - fromX, 2));
  var angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  var points = [[0, -width/2]];

  if(jaggedEnd) {
    // We don't actually draw the arrow, just the jagged end
    points.push(
      [length, -width/2]
    );

    for(let i=1; i<=2*jagNumber; i+=2) {
      points.push(
        [length - jagLength, -width/2 + jagIncY * i],
        [length,  -width/2 + jagIncY * (i + 1)]
      );
    }
  } else if(arrowWidth !== width) {
    points.push(
      [length - arrowLength, -width/2],
      [length - arrowLength, -arrowWidth/2],
      [length, 0],
      [length - arrowLength, +arrowWidth/2],
      [length - arrowLength, +width/2]
    );
  } else {
    points.push(
      [length - arrowLength, -width/2],
      [length, 0],
      [length - arrowLength, +width/2]
    );
  }

  points.push(
    [0, +width/2]
  );

  if(jaggedStart) {
    for(let i=1; i<=2*jagNumber; i+=2) {
      points.push(
        [jagLength, width/2 - jagIncY * i],
        [0,  width/2 - jagIncY * (i + 1)]
      );
    }
  }

  shape.move(Math.floor(fromX)+0.5, Math.floor(fromY)+0.5);
  console.log('rotate', angle)
  shape.rotate(angle);
  shape.polygon(points);

}