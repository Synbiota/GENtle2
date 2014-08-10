define(function(require) {
  var Q = require('q'),
      Artist = require('common/lib/graphics/artist'),
      _ = require('underscore.mixed'),
      RestrictionEnzymes = require('sequence/lib/restriction_enzymes'),
      Styles = require('text!styles.json'),
      PlasmidMapCanvas;

  Styles = JSON.parse(Styles);
  LineStyles = Styles.sequences.lines;

  PlasmidMapCanvas = function(options) {
    this.mouseTool = {};
    this.mouseTool.drag = false;

    this.view = options.view;
    this.$el = options.view.$el;
    this.model = options.view.model;
    this.$canvas = options.$canvas;
    this.artist = new Artist(options.$canvas);
    console.log("2");
    console.log(this.artist);

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

    this.relativeRadii = {
      currentSelection: {r:10/250, R:200/250},
      plasmidCircle: {r:150/250},
      linegraph: {
        r: 150/250
      },
      lineNumbering: {r:180/250, R:240/250},
      title_width: (200*0.8660254 - 50)/250,
      RES: {
        r: 140/250,
        R: 175/250,
        label: 179/250
      },
      features: {
        R: 130/250,
        width: 10/250,
        marginBottom: 3/250
      }
    };

    _.bindAll(this, 'render', 'refresh', 'handleClick');
    this.refresh();

    this.model.on('change', _.debounce(this.render, 500));
    this.view.parentView().on('resize', _.debounce(this.refresh, 200));
    this.$canvas.on('click', this.handleClick);
      
  };

  PlasmidMapCanvas.prototype.render = function () {

    this.clear();

    this.drawPositionMarks();
    this.drawSequence();
    this.drawSequenceInfo();
    this.drawGCAT();
    this.drawRES();
    this.drawFeatures();
    
  };

  PlasmidMapCanvas.prototype.refresh = function () {
    this.setupCanvas().then(this.render).catch(function(e) {
      console.log('ERROR', e.stack);
    });
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
        center: artist.point(width/2, height/2)
      };

      _this.radii = _this.updateRadii();

      artist.setDimensions(width, height);
      artist.translate(width / 2, height / 2);

      resolve();
    });
  };  

  PlasmidMapCanvas.prototype.updateRadii = function(obj) {
    var _this = this,
        size = Math.min(_this.canvasDims.width, _this.canvasDims.height) / 2,
        result = {};

    _.each(obj || this.relativeRadii, function(value, key) {
      result[key] = _.isObject(value) ? _this.updateRadii(value) : value * size;
    });

    return result;

  };

  PlasmidMapCanvas.prototype.drawPositionMarks = function() {

    var len = this.model.length(),
        lineNumberIncrement = this.bestLineNumbering(len, 100) , 
        angleIncrement = Math.PI*2 / ( len/lineNumberIncrement) ,
        r = - this.radii.lineNumbering.r,
        R = - this.radii.lineNumbering.R,
        textX = - this.radii.lineNumbering.R,
        textY = -5,
        artist = this.artist,
        angle = 0, linenumberinglen = 0;

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
        linenumberinglen = _.formatThousands(i*lineNumberIncrement).length;
        if((angle*180/Math.PI)<=270 && (angle*180/Math.PI)>=90)
          this.rotatedText(_.formatThousands(i*lineNumberIncrement),-textX-(linenumberinglen*5), textY);
        else
          this.text(_.formatThousands(i*lineNumberIncrement), textX, textY);
        this.rotate(angleIncrement);
        angle += angleIncrement;
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
        radii = this.radii.RES,
        angle = 0;

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
        var names = _.pluck(enzymes_, 'name');
        names = (names.length <= 2 ) ? names.join(', ') : (names[0] + ' +' + (names.length-1));
        position = 1*position;
        artist.rotate(Math.PI * 2 * (position - previousPosition) / len);
        artist.path(-radii.R, 0, -radii.r, 0);
        angle += (Math.PI * 2 * (position - previousPosition) / len);
        namelen = names.length;

        if((angle*180/Math.PI)<=270 && (angle*180/Math.PI)>=90)
          artist.rotatedText(names, radii.label+(namelen*6), 2);
        else
          artist.text(names, -radii.label, 2);        
        previousPosition = position;
      });
    });
  };

  PlasmidMapCanvas.prototype.drawFeatures = function() {
    var featuresStack = _.first(this.processFeatures(), 4),
        len = this.model.length(),
        _this = this,
        artist = _this.artist,
        startAngle, endAngle, arrowHead, r, R,
        colors = LineStyles.features.color;
        radii = this.radii.features;

    _.each(featuresStack, function(features, i) {
      _.each(features, function(feature) {
        var startAngle = Math.PI * 2 * feature.from / len,
            endAngle = Math.PI * 2 * feature.to / len,
            arrowHead = feature.reverseComplement ? 'tail' : 'front',
            R = radii.R - i * (radii.marginBottom + radii.width),
            r = R - radii.width,
            type = feature.type;

        artist.rotate(-Math.PI);

        artist.washer(0, 0, r, R, startAngle, endAngle, false, arrowHead, false, feature.name, {
          fillStyle: (colors[type] && colors[type].fill) || colors._default.fill,
          font: '9px Monospace',
          textStyle: (colors[type] && colors[type].color) || colors._default.color,
          textAlign: 'center'
        });

        artist.rotate(Math.PI);
      });
    });
  };

  PlasmidMapCanvas.prototype.processFeatures = function() {
    var id = -1,
        features = [],
        overlapStack = [], 
        output = [],
        overlapIndex;

    _.each(this.model.get('features'), function(feature) {
      _.each(feature.ranges, function(range) {
        features.push({
          name: feature.name,
          id: ++id,
          from: range.from,
          to: range.to,
          type: feature._type.toLowerCase(),
          reverseComplement: !!range.reverseComplement
        });
      });
    });

    for(var i = 0; i < features.length; i++) {
      feature = features[i];

      overlapIndex =  overlapStack.length;

      for(var j = overlapStack.length - 1; j >= 0; j--) {
        if(overlapStack[j] === undefined || overlapStack[j][1] <= feature.from) {
          overlapStack[j] = undefined;
          overlapIndex = j;
        }
      }

      overlapStack[overlapIndex] = [feature.from, feature.to];
      output[overlapIndex] = output[overlapIndex] || [];
      output[overlapIndex].push(feature);
    }

    return output;
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
      strokeStyle: 'rgba(90,90,90,.2)',
      lineWidth: 20
    });

    artist.updateStyle({
      lineWidth: 5
    });
  };

  PlasmidMapCanvas.prototype.drawGCAT = function() {

    var gcatCalc = this.calcGCAT(this.model, 300),
        radii = this.radii.linegraph;
    this.artist.radialLineGraph(0, 0, radii.r, 20, gcatCalc, {    
      fillStyle: 'rgba(90,90,90,.4)'
    });
  };

  PlasmidMapCanvas.prototype.calcGCAT = function(sequence,res){
  //determine quantities of G,C,A,T in chunks, given resolution
  var gcat_chunks = [],
      gcat_ratio = [],
      seq_length = sequence.length(),
      chunk_size = Math.ceil(seq_length/res),
      chunk_res = Math.ceil(seq_length/chunk_size),
      chunk, gs, cs, as, ts, i;

  for (i = 0; i < chunk_res; i++){
    if(i != chunk_res-1){
      chunk = sequence.getSubSeq(i*chunk_size, (i+1)*chunk_size);
    } else {
      chunk = sequence.getSubSeq(i*chunk_size);
    }
    gs = chunk.match(/G/g);
    cs = chunk.match(/C/g);
    as = chunk.match(/A/g);
    ts = chunk.match(/T/g);

    gcat_chunks.push({ 
      g: gs ? gs.length : 0,
      a: as ? as.length : 0,
      c: cs ? cs.length : 0,
      t: ts ? ts.length : 0,
      total: chunk.length
    });
  }

  for (i =0; i < chunk_res; i++){
    gcat_ratio.push((gcat_chunks[i].g + gcat_chunks[i].c)/gcat_chunks[i].total - 0.5);
  }

  window.ratio = gcat_ratio;

  return gcat_ratio;
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

    guess = Math.floor(q[i]*Math.pow(10,n));

    return guess === 0 ? Math.floor(bp/2) : guess;
  };

  PlasmidMapCanvas.prototype.clear = function() {
    var width = this.canvasDims.width,
        height = this.canvasDims.height;
    // TODO Refactor this Artist
    this.artist.context.clearRect(-width/2, -height/2, width, height);
  };

  PlasmidMapCanvas.prototype.handleClick = function(event) {
    var artist = this.artist,
        parentOffset = this.$canvas.offset(),
        centerPoint = artist.point(this.$canvas.width()/2, this.$canvas.height()/2),
        mousePoint = artist.point(event.pageX - parentOffset.left, event.pageY - parentOffset.top).sub(centerPoint),
        refPoint = artist.point(0, centerPoint.y).sub(centerPoint);
        angle = artist.normaliseAngle(Artist.angleBetween(refPoint, mousePoint));

    this.view.parentView().sequenceCanvas.scrollToBase(
      Math.floor(this.model.length() * angle / Math.PI / 2)
    );
  };


  return PlasmidMapCanvas;
});