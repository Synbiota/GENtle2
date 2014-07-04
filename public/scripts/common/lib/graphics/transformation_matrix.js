define(function(require) {
  var Point = require('./point'),
      TransformationMatrix;

  TransformationMatrix = function(a, b, c, d, e, f) {
    "use strict";
    /* Affine tranform matrix (same layout as canvas) :
     *   | a, c, e |
     *   | b, d, f |
     *   | 0, 0, 1 |
     */
    this.m = [];

    this.m[0] = a || 1.0;
    this.m[1] = b || 0.0;
    this.m[2] = c || 0.0;
    this.m[3] = d || 1.0;
    this.m[4] = e || 0.0;
    this.m[5] = f || 0.0;
  };

  TransformationMatrix.prototype.add = function(t2) {
    return new TransformationMatrix(
        this.m[0] + t2.m[0],
        this.m[1] + t2.m[1],
        this.m[2] + t2.m[2],
        this.m[3] + t2.m[3],
        this.m[4] + t2.m[4],
        this.m[5] + t2.m[5]
    );
  };

  TransformationMatrix.prototype.sub = function(t2) {
    return new TransformationMatrix(
      this.m[0] - t2.m[0],
      this.m[1] - t2.m[1],
      this.m[2] - t2.m[2],
      this.m[3] - t2.m[3],
      this.m[4] - t2.m[4],
      this.m[5] - t2.m[5]
    );
  };

  TransformationMatrix.prototype.mult = function(o2) {
    if (o2 instanceof TransformationMatrix) {
      return new TransformationMatrix(
          this.m[0] * o2.m[0] + this.m[2] * o2.m[1],
          this.m[1] * o2.m[0] + this.m[3] * o2.m[1],
          this.m[0] * o2.m[2] + this.m[2] * o2.m[3],
          this.m[1] * o2.m[2] + this.m[3] * o2.m[3],
          this.m[0] * o2.m[4] + this.m[2] * o2.m[5] + this.m[4],
          this.m[1] * o2.m[4] + this.m[3] * o2.m[5] + this.m[5]
      );
    } else {
      return new Point(
        this.m[0] * o2.x + this.m[2] * o2.y + this.m[4],
        this.m[1] * o2.x + this.m[3] * o2.y + this.m[5]
      );
    }
  };

  TransformationMatrix.prototype.invert = function() {
    var det = this.m[0] * this.m[3] - this.m[2] * this.m[1];
    return new TransformationMatrix(
      this.m[3] / det,
      -this.m[1] / det,
      -this.m[2] / det,
      this.m[0] / det,
      (this.m[2] * this.m[5] - this.m[4] * this.m[3]) / det,
      (this.m[4] * this.m[1] - this.m[0] * this.m[5]) / det
    );
  };

  TransformationMatrix.prototype.clone = function() {
    return new TransformationMatrix(
      this.m[0],
      this.m[1],
      this.m[2],
      this.m[3],
      this.m[4],
      this.m[5]
    );
  };

  TransformationMatrix.prototype.toString = function() {
    return "transform[" + this.m + "]";
  };

  return TransformationMatrix;
});