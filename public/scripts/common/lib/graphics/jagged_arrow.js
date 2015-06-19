/**
@class Rect
@extends Shape
@module Graphics
**/
import Shape from './shape';

class JaggedArrow extends Shape {
  constructor(artist, fromX, fromY, toX, toY, width, arrowLength, arrowWidth = undefined, jaggedStart = false, jaggedEnd = false) {
    super();
    this.artist = artist;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.width = width;
    this.arrowLength = arrowLength;
    this.arrowWidth = arrowWidth || width;
    this.jaggedStart = jaggedStart;
    this.jaggedEnd = jaggedEnd;
    this.jagLength = 3;
    this.jagNumber = 2;
  }

  draw(styleOptions) {
    var artist = this.artist;
    var context = artist.context;
    var {
      fromX, 
      fromY, 
      toX, 
      toY, 
      width, 
      arrowLength, 
      arrowWidth, 
      jaggedStart,
      jaggedEnd,
      jagLength,
      jagNumber
    } = this;
    var jagIncY = width / jagNumber / 2;

    artist.updateStyle(styleOptions);
    artist.onTemporaryTransformation(() => {
      var length = Math.sqrt(Math.pow(toY - fromY, 2) + Math.pow(toX - fromX, 2));
      var angle = Math.atan2(toY - fromY, toX - fromX);
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

      artist.translate(Math.floor(fromX)+0.5, Math.floor(fromY)+0.5);
      artist.rotate(angle);

      context.beginPath();
      context.moveTo(0, 0);
      points.forEach(function([x, y]) { context.lineTo(x, y); });
      context.closePath();
      context.fill();
      context.stroke();

    });
  }

}

export default JaggedArrow;