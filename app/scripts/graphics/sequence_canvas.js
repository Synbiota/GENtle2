/**
  Handles displaying the currentSequence sequence in a canvas

  @class SequenceCanvas
**/ 
define([
  'jquery', 
  'graphics/artist', 
  'utils/evented_object', 
  'views/data_view',
  'models/data_model',
  'hbars!views/templates/sequence_canvas_settings'
  ], function($, Artist, EventedObject, DataView, DataModel, settingsTemplate) {

  var SequenceCanvas = EventedObject.extend(function() {
    var this_ = this;
    this.$element = $('<canvas></canvas>').attr('id', 'sequence_canvas_'+Date.now());

    /**
    Instance of {{#crossLink "Artist"}}{{/crossLink}} used to draw on the canvas.
    @property {Artist} artist 
    **/
    this.artist = new Artist(this.$element[0]);

    /**
    @property visible
    @type Boolean
    @default false
    **/
    this.visible = false;

    this.settingsView = new DataView({model: new DataModel(), template: settingsTemplate});

    this.on('visible', function(){
      this_.visible = true;
      this_.updateCanvasDims();
      this_.display();
    });

    this.on('hidden', function() {
      this_.visible = false;
    });

    this.on('resize', function(){
      this_.updateCanvasDims();
    });

    /**
    @property layoutSettings
    @type Object
    @default false
    **/
    this.layoutSettings = {
      canvasDims: {width:1138, height:448},
      pageMargins: {left:50,top:50,right:50,bottom:50},
      scrollPercentage: 1.0,
      gutterWidth: 10,
      positionText: {font: "10px Monospace", colour:"#005"},
      basePairText: {font: "14px Monospace", colour:"#000"},
      basePairDims: {width:10, height:15},
      sequenceLength: 4000,
      lines: [
        {type:'blank', height:5},
        {type:'position', height:15},
        {type:'dna', height:25}]
    } ;
    

    this.layoutHelpers = {};

    this.calculateLayoutSettings();

  });

  /**
    Updates Canvas Dims based on layout.
    @method updateCanvasDims
  **/
  SequenceCanvas.prototype.updateCanvasDims = function() {
      var width = this.$element[0].scrollWidth;
      var height = this.$element[0].scrollHeight;

      this.layoutSettings.canvasDims.width = width;
      this.layoutSettings.canvasDims.height = height;

      this.$element[0].width = width;
      this.$element[0].height = height;

      this.calculateLayoutSettings();
  }


  /**
    Calculate "helper" layout settings based on already set layout settings
    @method calculateLayoutSettings
  **/
  SequenceCanvas.prototype.calculateLayoutSettings = function() {
    //line offsets
    var line_offset = this.layoutSettings.lines[0].height,
        i, 
        deca_bases_per_row,
        ls = this.layoutSettings,
        lh = this.layoutHelpers;

    lh.lineOffsets = [0]
    for (i = 1; i < ls.lines.length; i ++){
      lh.lineOffsets.push(line_offset);
      line_offset += ls.lines[i].height;
    }

    //row height
    lh.rows = {height:line_offset};

    //basesPerRow
    deca_bases_per_row = Math.floor( (ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right))/(10 * ls.basePairDims.width + ls.gutterWidth) );
    if (deca_bases_per_row != 0){
      lh.basesPerRow = 10*deca_bases_per_row;
    }else{
      lh.basesPerRow = Math.floor((ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right))/ls.basePairDims.width);
      //we want bases per row to be a multiple of 10
      if (lh.basesPerRow > 5){
        lh.basesPerRow = 5;
      }else if (lh.basesPerRow > 2){
        lh.basesPerRow = 2;
      }else{
        lh.basesPerRow = 1;
      }
    }

    //total number of rows in sequence, 
    lh.rows.total = Math.ceil(ls.sequenceLength / lh.basesPerRow) ;
    // number of visible rows in canvas
    lh.rows.visible = Math.ceil(ls.canvasDims.height / lh.rows.height) ;

    //page dims
    lh.pageDims = {
      width:ls.canvasDims.width, 
      height: ls.pageMargins.top + ls.pageMargins.bottom + lh.rows.total*lh.rows.height 
    };

    // canvas y offset
    lh.yOffset = 0;
    if (ls.canvasDims.height < lh.pageDims.height){
      lh.yOffset = (lh.pageDims.height - ls.canvasDims.height) * ls.scrollPercentage ;
    }

    // first row (starting at which row do we need to actually display them)
    lh.rows.first = Math.floor((lh.yOffset - ls.pageMargins.top)/lh.rows.height);
    if (lh.rows.first < 0) lh.rows.first = 0;

  }

  /** 
    If `this.visible`, displays the sequence in the initiated canvas.
    @method display
  **/ 
  SequenceCanvas.prototype.display = function() {
    if(this.visible) {
      var i,j,k,x,y,
          pos,
          ls = this.layoutSettings,
          lh = this.layoutHelpers,
          row,
          ctx = this.artist.context; //just doing a run without the artist...

      //clear canvas
      ctx.fillStyle = "#fff";
      ctx.fillRect (0,0,ctx.canvas.width, ctx.canvas.height);
      

      y = -lh.yOffset + ls.pageMargins.top + lh.rows.first*lh.rows.height;

      for(i = 0; i < lh.rows.visible; i++){
        for(j = 0; j < ls.lines.length; j++){
          switch(ls.lines[j].type)
          {
            case "blank":
              //do nothing!
              break;
            case "position":
              // numbering for position
              ctx.fillStyle = ls.positionText.colour;
              ctx.font = ls.positionText.font;
              
              x = ls.pageMargins.left;
              pos = (lh.rows.first + i)*lh.basesPerRow + 1;
              for(k = 0; k < lh.basesPerRow; k+=10){
                ctx.fillText(pos+k, x, y);
                x += 10*ls.basePairDims.width + ls.gutterWidth;
              }
              break;
            case "dna":
              //draw the DNA text
              ctx.fillStyle = ls.basePairText.colour;
              ctx.font = ls.basePairText.font;

              x = ls.pageMargins.left;
              seq = gentle.currentSequence.get((lh.rows.first + i)*lh.basesPerRow,(lh.rows.first + i)*lh.basesPerRow+lh.basesPerRow)
              for(k = 0; k < lh.basesPerRow; k++){
                ctx.fillText(seq[k], x, y);
                x += ls.basePairDims.width;
                if ((k + 1) % 10 === 0) x += ls.gutterWidth;
              }
              break;
            default:
              //do nothing!
          }
          y += ls.lines[j].height
        }
        y += lh.rows.height;
      }
    }
  };

  return SequenceCanvas;
});