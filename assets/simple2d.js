/*!
 * Very simple 2d geometry objects.
 *
 * Copyright (c) 2013 Al Grant (http://www.algrant.ca)
 *
 * Licensed under MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Based almost entirely on this: 
 * http://www.cgl.uwaterloo.ca/~csk/projects/escherization/geo.py.txt
 */

var  simple2d = {};

simple2d.Point = function (x, y) {
    "use strict";

    if (!(this instanceof simple2d.Point)) {
        throw new Error("Point constructor called as function!");
    }

    this.x = x || 0.0;
    this.y = y || 0.0;

    this.add = function (p2) {
        return new simple2d.Point(this.x + p2.x, this.y + p2.y);
    };

    this.clone = function () {
        return new simple2d.Point(this.x, this.y);
    }

    this.sub = function (p2) {
        return new simple2d.Point(this.x - p2.x, this.y - p2.y);
    };

    this.mult = function (s) {
        return new simple2d.Point(this.x * s, this.y * s);
    };

    this.div = function (s) {
        return new simple2d.Point(this.x / s, this.y / s);
    };

    this.neg = function () {
        return new simple2d.Point(-this.x, -this.y);
    };

    this.magnitude2 = function () {
        return this.x * this.x + this.y * this.y;
    };

    this.magnitude = function () {
        return Math.sqrt(this.magnitude2());
    };

    this.distance2 = function (p2) {
        var dx = this.x - p2.x,
            dy = this.y - p2.y;
        return dx * dx + dy * dy;
    };

    this.distance = function (p2) {
        return Math.sqrt(this.distance2(p2));
    };

    this.normalise = function () {
        return this.div(this.magnitude());
    };

    this.scale = function (sx, sy) {
        return new simple2d.Point(this.x * sx, this.y * sy);
    };

    this.toString = function () {
        return "Point(" + this.x + "," + this.y + ")";
    };
};

simple2d.Transform = function(a, b, c, d, e, f) {
    "use strict";
    /* Affine tranform matrix (same layout as canvas) :
     *   | a, c, e |
     *   | b, d, f |
     *   | 0, 0, 1 |
     */

    if (!(this instanceof simple2d.Transform)) {
        throw new Error("Transform constructor called as function!");
    }

    this.m = [];

    this.m[0] = a || 1.0;
    this.m[1] = b || 0.0;
    this.m[2] = c || 0.0;
    this.m[3] = d || 1.0;
    this.m[4] = e || 0.0;
    this.m[5] = f || 0.0;

    this.add = function(t2) {
        return new simple2d.Transform(
            this.m[0] + t2.m[0],
            this.m[1] + t2.m[1],
            this.m[2] + t2.m[2],
            this.m[3] + t2.m[3],
            this.m[4] + t2.m[4],
            this.m[5] + t2.m[5]
        );
    };

    this.sub = function(t2) {
        return new simple2d.Transform(
            this.m[0] + t2.m[0],
            this.m[1] + t2.m[1],
            this.m[2] + t2.m[2],
            this.m[3] + t2.m[3],
            this.m[4] + t2.m[4],
            this.m[5] + t2.m[5]
        );
    };

    this.mult = function(o2) {
        var toreturn;
        if (o2 instanceof simple2d.Transform) {
            toreturn = new simple2d.Transform(
                this.m[0] * o2.m[0] + this.m[2] * o2.m[1],
                this.m[1] * o2.m[0] + this.m[3] * o2.m[1],
                this.m[0] * o2.m[2] + this.m[2] * o2.m[3],
                this.m[1] * o2.m[2] + this.m[3] * o2.m[3],
                this.m[0] * o2.m[4] + this.m[2] * o2.m[5] + this.m[4],
                this.m[1] * o2.m[4] + this.m[3] * o2.m[5] + this.m[5]
            );
        } else {
            toreturn = new simple2d.Point(
                this.m[0] * o2.x + this.m[2] * o2.y + this.m[4],
                this.m[1] * o2.x + this.m[3] * o2.y + this.m[5]
            );
        }

        return toreturn;
    };

    this.invert = function() {
        var det = this.m[0] * this.m[3] - this.m[2] * this.m[1];
        return new simple2d.Transform(
            this.m[3] / det,
            -this.m[1] / det,
            -this.m[2] / det,
            this.m[0] / det,
            (this.m[2] * this.m[5] - this.m[4] * this.m[3]) / det,
            (this.m[4] * this.m[1] - this.m[0] * this.m[5]) / det
        );
    };

    this.clone = function() {
        return new simple2d.Transform(
            this.m[0],
            this.m[1],
            this.m[2],
            this.m[3],
            this.m[4],
            this.m[5]
        ) ;
    }

    this.toString = function() {
        return "Transform[" + this.m + "]";
    };
};

simple2d.IDENTITY = new simple2d.Transform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);

simple2d.translate = function (x, y) {
    "use strict";
    return new simple2d.Transform(1.0, 0.0, 0.0, 1.0, x, y);
};

simple2d.rotate = function (t) {
    "use strict";
    return new simple2d.Transform(
        Math.cos(t),
        Math.sin(t),
        -Math.sin(t),
        Math.cos(t),
        0.0,
        0.0
    );
};

simple2d.reflect = function (line) {
    "use strict";
    var mag2 = line.magnitude2();
    return new simple2d.Transform(
        (line.x * line.x - line.y * line.y) / mag2,
        2 * line.x * line.y / mag2,
        2 * line.x * line.y / mag2,
        (line.y * line.y - line.x * line.x) / mag2,
        0.0,
        0.0
    );
};

simple2d.rotateAround = function (p, t) {
    "use strict";
    return simple2d.translate(p.x, p.y).mult(simple2d.rotate(t)).mult(simple2d.translate(-p.x, -p.y));
};

simple2d.angleBetween = function (p1, p2) {
    "use strict";
    var a1 = Math.atan2(p1.y, p1.x),
        a2 = Math.atan2(p2.y, p2.x);
    return a2 - a1;
};

simple2d.linescross = function (p1, p2, p3, p4) {
    "use strict";
    var D = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x),
        x = ((p3.x - p4.x) * (p1.x * p2.y - p1.y * p2.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / D,
        y = ((p3.y - p4.y) * (p1.x * p2.y - p1.y * p2.x) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / D;
    return new simple2d.Point(x, y);
};

simple2d.centroid = function (p1, p2, p3, p4) {
    "use strict";
    return new simple2d.Point((p1.x + p2.x + p3.x + p4.x) / 4, (p1.y + p2.y + p3.y + p4.y) / 4);
};