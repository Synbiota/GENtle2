/**
@class Text
@extends Shape
**/
define(function(require) {
  var Shape = require('./shape'),
      Gentle = require('gentle')(),
      Text;

  Text = function() {
    var args = _.toArray(arguments),
        styleOptions;

    this.artist = args.shift();
    this.text = args.shift();
    this.x = args.shift();
    this.y = args.shift();
    this.model = Gentle.currentSequence;

    styleOptions = args.shift() || {};
    styleOptions.lineHeight = styleOptions.lineHeight || 0;
    styleOptions.textPadding = styleOptions.textPadding || 0;
    this.styleOptions = styleOptions;
  };

  _.extend(Text.prototype, Shape.prototype);

   Text.prototype.draw = function() {
    var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions,
        textWidth;

    if(styleOptions.backgroundFillStyle) {
      artist.updateStyle({
        fillStyle: styleOptions.backgroundFillStyle,
        font: styleOptions.font
      });
      textWidth = context.measureText(this.text).width + 2 * styleOptions.textPadding;
      context.fillRect(this.x, this.y, textWidth, styleOptions.height);
    }

    artist.updateStyle(styleOptions);
    artist.context.fillText(this.text, this.x + styleOptions.textPadding, this.y + styleOptions.lineHeight);
  };


  Text.prototype.rotateAndWriteText = function() {
    var artist = this.artist,
        context = artist.context,
        styleOptions = this.styleOptions,               
        textWidth;

    context.rotate(Math.PI);
    context.fillText(this.text,this.x+styleOptions.textPadding,(this.y+styleOptions.lineHeight));
    context.rotate(-Math.PI);

  };

  Text.prototype.reverseText = function(text){
    return text.split("").reverse().join("");
  };

   Text.prototype.moveVertically = function(yOffset){
        this.yOffset = yOffset;
        //Visible canvas height
        var visibleCanvas = this.artist.canvas.height;

       if(this.prevYoffset !== undefined){
            //No change in Y offset
             if((this.prevYoffset-this.yOffset)===0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
            //Scroll down
             if((this.prevYoffset-this.yOffset)>0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
            //Scroll up
             if((this.prevYoffset-this.yOffset)<0)
                this.y = (this.prevYoffset-this.yOffset+ this.refY);
          
        }
        if(this.prevYoffset === undefined){
            //Setting previous Y offset
            this.prevYoffset = this.yOffset;
            //Setting Initial Y position for reference.
              if(this.refY === undefined)
                this.refY = this.y;
        }
  };

  Text.prototype.isVisible = function(){
   var artist = this.artist,
      visibleCanvas = artist.canvas.height;
        //Visibility set from -30 to  artist.canvas.height + 30
        if(this.y>=(-30) || (this.y+this.lineHeight)>=(-30)) 
          if(this.y<(visibleCanvas+30) || (this.y+this.lineHeight)<(visibleCanvas+30)){
            return true;
         }
        return false;
  };

  Text.prototype.includesPoint = function(x,y){
  var posX = x, 
  //Accounting for navbar height
  posY = y-50, 
  visibleCanvas = this.artist.canvas.height;
  if(posX !== undefined && posY !== undefined)
  //X pos greater than this.x
  if(posX>=(this.x))
  {   
    //Scroll up
    if((this.prevYoffset-this.yOffset)<0)
      //Cover full height of rect
      if(posY>=(this.y) && posY<=(this.y+this.lineHeight))
        {
          return true;
        }
    //No change in Y offset
    if((this.prevYoffset-this.yOffset)==0)
      //Cover full height of rect
      if(posY>=(this.y) && posY<=(this.y+this.lineHeight))
      {
        return true;
      }
    //Scroll down
    if((this.prevYoffset-this.yOffset)>0)
      //Cover full height of rect 
      if((posY)>=(this.y) && (posY)<=(this.y+this.lineHeight))
      {
        return true;
      }
  }
  else
    return false;
  };

  return Text;
});