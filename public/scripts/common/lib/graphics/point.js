// define(function(require) {
  var Point;

  Point = function(x, y) {
    this.x = x || 0.0;
    this.y = y || 0.0;
  };

  Point.prototype.add = function (p2) {
    return new Point(this.x + p2.x, this.y + p2.y);
  };

  Point.prototype.clone = function () {
    return new Point(this.x, this.y);
  };

  Point.prototype.sub = function (p2) {
    return new Point(this.x - p2.x, this.y - p2.y);
  };

  Point.prototype.mult = function (s) {
    return new Point(this.x * s, this.y * s);
  };

  Point.prototype.div = function (s) {
    return new Point(this.x / s, this.y / s);
  };

  Point.prototype.neg = function () {
    return new Point(-this.x, -this.y);
  };

  Point.prototype.magnitude2 = function () {
    return this.x * this.x + this.y * this.y;
  };

  Point.prototype.magnitude = function () {
    return Math.sqrt(this.magnitude2());
  };

  Point.prototype.distance2 = function (p2) {
    var dx = this.x - p2.x,
        dy = this.y - p2.y;
    return dx * dx + dy * dy;
  };

  Point.prototype.distance = function (p2) {
    return Math.sqrt(this.distance2(p2));
  };

  Point.prototype.normalise = function () {
    return this.div(this.magnitude());
  };

  Point.prototype.scale = function (sx, sy) {
    return new Point(this.x * sx, this.y * sy);
  };

  Point.prototype.toString = function () {
    return "point(" + this.x + "," + this.y + ")";
  };

  // return Point;
export default Point;
// });