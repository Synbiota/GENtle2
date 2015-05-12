import Shape from './shape';

export default class SmoothLineGraph extends Shape {
  constructor(artist, points) {
    super();
    this.artist = artist;
    this.points = points;
  }

  draw(styleOptions) {
    var artist = this.artist;
    var ctx = artist.context;
    var points = this.points;

    artist.updateStyle(styleOptions);
    ctx.beginPath();

    ctx.moveTo(points[0][0], points[0][1]);

    // debugger
    for(var i = 0; i < points.length - 2; i++) {
      let xc = (points[i][0] + points[i + 1][0]) / 2;
      let yc = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][0], xc, yc);
    }

    ctx.quadraticCurveTo(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);

    ctx.stroke();
  }
}