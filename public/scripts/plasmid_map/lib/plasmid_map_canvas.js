define(function(require) {
  var Q = require('q'),
      Artist = require('common/lib/graphics/artist'),
      _ = require('underscore.mixed'),
      RestrictionEnzymes = require('sequence/lib/restriction_enzymes'),
      PlasmidMapCanvas;

  PlasmidMapCanvas = function(options) {
    this.mouseTool = {};
    this.mouseTool.drag = false;

    this.view = options.view;
    this.$el = options.view.$el;
    this.model = options.view.model;
    this.$canvas = options.$canvas;
    this.artist = new Artist(options.$canvas);

    // Keep track of context's transform, reference:
    // http://stackoverflow.com/questions/7395813/html5-canvas-get-transform-matrix
    this.ctm = {
      t: new this.artist.transform(),
      translate: function(x, y){
        this.ctm.t = this.ctm.t.mult(this.artist.translate(x, y));
        this.artist.translate(x, y);
      },
      rotate: function(t){
        this.ctm.t = this.ctm.t.mult(this.artist.rotate(t));
        this.artist.rotate(t);
      }
    };

    this.radii = {
      currentSelection: {r:10, R:200},
      plasmidCircle: {r:150},
      features: {r1:125, r2:140, r3:160, r4:175 },
      linegraph: {r:100},
      lineNumbering: {r:180, R:240},
      title_width: 200*0.8660254 - 50,
      RES: {
        r: 144,
        R: 170,
        label: 174
      }
    };

    _.bindAll(this, 'render');

    this.setupCanvas().then(this.render);

    this.model.on('change', _.debounce(this.render, 500));
      
  };

  PlasmidMapCanvas.prototype.render = function () {

    this.clear();

    this.drawPositionMarks();
    this.drawSequence();
    this.drawSequenceInfo();
    this.drawRES();
    
  };

  PlasmidMapCanvas.prototype.setupCanvas = function() {
    var _this = this,
        artist = _this.artist;

    return Q.promise(function(resolve, reject) {
      // Updates width of $canvas to take scrollbar of $scrollingParent into account
      _this.$canvas.width(_this.$el.width());

      var width = _this.$canvas[0].scrollWidth,
          height = _this.$canvas[0].scrollHeight;

      _this.canvasDims = { 
        width: width,
        height: height,
        center: artist.point(width, height)
      };

      artist.setDimensions(width, height);
      artist.translate(width / 2, height / 2);

      resolve();
    });
  };

  PlasmidMapCanvas.prototype.drawPositionMarks = function() {

    var len = this.model.length(),
        lineNumberIncrement = this.bestLineNumbering(len, 100) , 
        angleIncrement = Math.PI*2 / ( len/lineNumberIncrement) ,
        r = - this.radii.lineNumbering.r,
        R = - this.radii.lineNumbering.R,
        textX = - this.radii.lineNumbering.R,
        textY = -5,
        artist = this.artist;

    artist.updateStyle({
      strokeStyle: '#bbb', 
      fillStyle: "#bbb",
      lineWidth: 1 ,
      font: "9px Monospace",
      textAlign: 'start'
    });

    artist.onTemporaryTransformation(function() {
      // `this` is now `artist`
      for(var i = 0; i < len/lineNumberIncrement; i++){
        this.path(r, 0, R, 0);
        this.text(_.formatThousands(i*lineNumberIncrement), textX, textY);
        this.rotate(angleIncrement);
      }
    });

  };

  PlasmidMapCanvas.prototype.drawRES = function() {
    var displaySettings = this.model.get('displaySettings.rows.res') || {},
        enzymes = RestrictionEnzymes.getAllInSeq(this.model.get('sequence'), {
          length: displaySettings.lengths || [],
          customList: displaySettings.custom || []
        }),
        len = this.model.length(),
        previousPosition = 0,
        artist = this.artist,
        radii = this.radii.RES;

    // artist.setLineDash([1.5,3]);

    artist.updateStyle({
      strokeStyle: "#59955C",
      font: "10px Monospace",
      fillStyle: "#59955C",
      lineWidth: 1,
      textAlign: 'right'
    });

    artist.onTemporaryTransformation(function() {
      _.each(enzymes, function(enzymes_, position) {
        position = 1*position;
        artist.rotate(Math.PI * 2 * (position - previousPosition) / len);
        artist.path(-radii.R, 0, -radii.r, 0);
        artist.text(_.pluck(enzymes_, 'name').join(','), -radii.label, 2);
        previousPosition = position;
      });
    });
  };

  PlasmidMapCanvas.prototype.drawSequenceInfo = function() {
    var context = this.artist.context,
        len = this.model.length();

    context.fillStyle = "white";
    context.textAlign = 'center';
    context.font = "bold 12px Arial";
    context.fillStyle = "#bbb";
    var name_lines = this.artist.wrapText(context, this.model.get('name'), this.radii.title_width);
    var metrics = context.measureText(this.model.get('name'));
    var line_height = 15;
    for (var i = 0; i < name_lines.length; i++){

      context.fillText(name_lines[i], 0,line_height*(-name_lines.length/3+i)); 

    }
    context.font = "italic 12px Arial";
    context.fillText(""+_.formatThousands(len)+" bp", 0,line_height*(name_lines.length*2/3));

  };

  PlasmidMapCanvas.prototype.drawSequence = function() {
    var artist = this.artist;

    artist.arc(0,0,this.radii.plasmidCircle.r,0,Math.PI*2, true, {
      strokeStyle: 'rgba(90,90,90,.5)',
      lineWidth: 15
    });

    artist.updateStyle({
      lineWidth: 5
    });
  };

  PlasmidMapCanvas.prototype.bestLineNumbering = function(bp,radius){

    var min_d = 25;
    var max_d = 100;

    var min_c = Math.floor(2*Math.PI*radius/max_d);
    var max_c = Math.floor(2*Math.PI*radius/min_d);
    var c = min_c;
    var q = [1,2,2.5,5];
    var i = 0;
    var n = Math.floor(Math.log(bp/(q[q.length-1]*(max_c+1)))/Math.log(10));
    var guess = (c+1)*q[i]*Math.pow(10,n);

    while (guess < bp){
      
      if (c < max_c){
        c = c+1;
      }else{
        c = min_c;
        if(i < q.length -1){
          i+=1;
        }else{
          i = 0;
          n += 1;
        }
      }
      guess = (c+1)*q[i]*Math.pow(10,n);
    }

    return Math.floor(q[i]*Math.pow(10,n));
  };

  PlasmidMapCanvas.prototype.clear = function() {
    var width = this.canvasDims.width,
        height = this.canvasDims.height;
    // TODO Refactor this Artist
    this.artist.context.clearRect(-width/2, -height/2, width, height);
  };


  return PlasmidMapCanvas;
});