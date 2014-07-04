define(function(require) {
  var Backbone        = require('backbone.mixed'),
      Gentle          = require('gentle')(),
      Artist          = require('common/lib/graphics/artist'),
      SequenceCanvas = require('sequence/lib/sequence_canvas'),
      template        = require('hbars!plasmid_map/templates/plasmid_map_view'),
      LinearMapView;

  PlasmidMapView = Backbone.View.extend({
    manage: true,
    className: 'plasmid-map',
    template: template,

    initialize: function() {
      this.model = Gentle.currentSequence;
    },

    initPlasmidMap: function(){

    this.sequenceCanvas = new SequenceCanvas({
        view: this,
        $canvas: this.$('canvas').first()
      });

  this.mouseTool = {};
  this.mouseTool.drag = false;

  var canvas = document.getElementById('plasmid_map_canvas') ;
  this.artist = new Artist(canvas);  
  this.artist.clear();
  this.context = this.artist.context;

  this.context.canvas.width = parseInt ( $('#plasmid_map_canvas').width() ) ;
  this.context.canvas.height = parseInt ( $('#plasmid_map_canvas').height() ) ;

  this.canvasOffset = { x: this.context.canvas.width / 2, y:this.context.canvas.height /2};

  // Keep track of context's transform, reference:
  // http://stackoverflow.com/questions/7395813/html5-canvas-get-transform-matrix
  this.ctm = {
    t: new this.artist.transform()
  } ;

  this.ctm.translate = function(x, y){
    this.ctm.t = this.ctm.t.mult(this.artist.translate(x, y));
        this.context.translate(x, y);
  }
  this.ctm.rotate = function(t){
    this.ctm.t = this.ctm.t.mult(this.artist.rotate(t));
        this.context.rotate(t);
  }
    this.ctm.setTransform = function(newt){
        this.ctm.t = newt.clone();
        this.context.setTransform(  newt.m[0], 
                                    newt.m[1], 
                                    newt.m[2], 
                                    newt.m[3], 
                                    newt.m[4], 
                                    newt.m[5]
        )
    }
  

  this.radii = {
          currentSelection: {r:10, R:200},
          plasmidCircle: {r:150},
          annotations: {r1:125, r2:140, r3:160, r4:175 },
          linegraph: {r:100},
          lineNumbering: {r:180, R:240},
          title_width: 200*0.8660254 - 50
  };

var len = this.model.get('sequence').length;

var from = 0 * Math.PI * 2 / len;
var to = 1 * Math.PI * 2 / len;
var height = $('#plasmid_map_canvas').height();
this.currentSelection = this.artist.washer(0,0,this.radii.currentSelection.r,this.radii.currentSelection.R,from,to,'#FFFFC8', 'rgba(0,0,0,0)',false);
this.renderMap();
    },

  renderMap: function () {

  var len =this.model.get('sequence').length;

  //clear canvas set bg colour to white
    // using a box defined by our canvas, then pushed through our matrices!
   /* var p1 = this.ctm.t.invert().mult(new simple2d.Point(0, 0)),
        p2 = this.ctm.t.invert().mult(new simple2d.Point(this.context.canvas.width, 0)),
        p3 = this.ctm.t.invert().mult(new simple2d.Point(this.context.canvas.width, this.context.canvas.height)),
        p4 = this.ctm.t.invert().mult(new simple2d.Point(0, this.context.canvas.height));

  this.context.fillStyle = 'white' ;
    this.context.beginPath();
    this.context.moveTo(p1.x, p1.y);
    this.context.lineTo(p2.x, p2.y);
    this.context.lineTo(p3.x, p3.y);
    this.context.lineTo(p4.x, p4.y);
    this.context.lineTo(p1.x, p1.y);
  this.context.fill(); */

  //draw line numbers
  var lineNumberIncrement = this.artist.bestLineNumbering(len, 200) ; 
  var angleIncrement = Math.PI*2 / ( len/lineNumberIncrement) ;
  var r =  - this.radii.lineNumbering.r;
  var R =    - this.radii.lineNumbering.R;
  var textX = - this.radii.lineNumbering.R;
  var textY = -10;
  var height = $('#plasmid_map_canvas').height();

  this.context.translate(250,height/2);
  this.context.save() ;
  this.strokeStyle = '#000' ; 
  this.context.fillStyle = "#000";
  this.context.lineWidth = 1 ;
  this.context.font = "10px Arial";
  this.context.textAlign = 'start';
  this.context.rotate(Math.PI);

  for ( var i = 0; i < len/lineNumberIncrement; i++){
    this.context.beginPath()
    this.context.moveTo(r,0);
    this.context.lineTo(R,0);
    this.context.stroke();
    this.context.fillText(i*lineNumberIncrement, textX, textY);
    this.context.rotate(angleIncrement);
  }
  this.context.restore() ;

  //draw the current selection marker first
  this.currentSelection.draw(this.artist);

  //draw a circle to represent our plasmid...
  this.context.beginPath();
  this.context.arc(0,0,this.radii.plasmidCircle.r,0,Math.PI*2, true);
  this.context.strokeStyle = 'grey';
  this.context.lineWidth = 15;
  this.context.stroke();
  this.context.lineWidth = 5;

  //draw annotations >>HERE

  //this.linegraph.draw(this.context);
  var secret_div = $('<div>' + '</div>')
          .css({'position': 'absolute', 
                'float': 'left', 'white-space': 'nowrap', 
                'visibility': 'hidden', 'font': '12px Arial'})
          .appendTo($('body')) ;
  //Write the name in the centre

  this.context.save();
  var t = this.ctm.t.clone() ;
  this.context.rotate(t.m[1] < 0 ? Math.acos(t.m[0]) : Math.PI + Math.acos( - t.m[0]) );
  this.context.fillStyle = "white";
  this.context.textAlign = 'center';
  this.context.font = "bold 12px Arial";
  this.context.fillStyle = "black";
  var name_lines = this.artist.wrapText(this.context, this.model.get('name'), this.radii.title_width);
  var metrics = this.context.measureText(this.model.get('name'));
  var line_height = 15;
  for (var i = 0; i < name_lines.length; i++){

    this.context.fillText(name_lines[i], 0,line_height*(-name_lines.length/3+i)); 

  }
  this.context.font = "italic 12px Arial";
  this.context.fillText(""+len+" bp", 0,line_height*(name_lines.length*2/3));

  this.context.restore();
  secret_div.remove();
  },

   afterRender: function(){
      this.initPlasmidMap();
   }

});
  return PlasmidMapView;

});