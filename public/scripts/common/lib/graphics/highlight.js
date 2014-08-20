define(function(require) {

  Highlight = function(seqCanvas) {
    "use strict";
     this.sequenceCanvas = seqCanvas;
  };

  Highlight.prototype.setColor = function(highlightColor, textColor) {
    if(highlightColor !== undefined)
      this.highlightColor = highlightColor;
    else
      this.highlightColor = "#FFFFFF";

    if(textColor !== undefined)
     this.textColor = textColor;
    else
     this.textColor = "#000000";
  };

  Highlight.prototype.calculateHeight = function(y){
   var height = this.sequenceCanvas.layoutSettings.lines.dna.height,
       lh     = this.sequenceCanvas.layoutHelpers,
       ls     = this.sequenceCanvas.layoutSettings,
       totalHeight = y + height - 10 - lh.yOffset;

        if(ls.lines.position.visible())
           totalHeight = totalHeight + ls.lines.position.height;
        if(ls.lines.aa.visible())
           totalHeight = totalHeight + ls.lines.aa.height;
        if(!ls.lines.topSeparator.visible() && !ls.lines.bottomSeparator.visible())
           totalHeight = totalHeight - 3;
        if(ls.lines.restrictionEnzymesLabels.height > 0)
           totalHeight = totalHeight + ls.lines.restrictionEnzymesLabels.height; 
        if(!ls.lines.topSeparator.visible() && !ls.lines.bottomSeparator.visible()) 
           totalHeight = totalHeight - 2;  

  return totalHeight;

  };

  Highlight.prototype.draw = function(from, to){

   var  ls              = this.sequenceCanvas.layoutSettings,
        lh              = this.sequenceCanvas.layoutHelpers,
        sequence        = this.sequenceCanvas.sequence,
        nBases          = Math.abs(to - from),
        artist          = this.sequenceCanvas.artist,
        y               = this.sequenceCanvas.getYPosFromBase(from),
        height          = this.sequenceCanvas.layoutSettings.lines.dna.height,
        x               = this.sequenceCanvas.getXPosFromBase(from),
        yOffset         = this.sequenceCanvas.layoutHelpers.yOffset,
        k, subSequence, character, currentBase,
        baseLine        = ls.lines.dna.baseLine,
        sequence        = this.sequenceCanvas.sequence,
        baseRange       = this.sequenceCanvas.getBaseRangeFromYPos(y),
        totalHeight     = this.calculateHeight(y);
 

        /*artist.rect(x, totalHeight, ls.basePairDims.width*nBases   ,height, {
            fillStyle: this.highlightColor
          });
        */
        subSequence = sequence.getSubSeq(from, to); 

        if(subSequence) {
          for(k = 0; k < nBases  ; k++){
            if(!subSequence[k]) break;
               currentBase = this.sequenceCanvas.getBaseFromXYPos(x,y);
               if(currentBase > baseRange[1])
               {
               x = this.sequenceCanvas.getXPosFromBase(currentBase);
               y = this.sequenceCanvas.getYPosFromBase(currentBase);
               totalHeight = this.calculateHeight(y);
               }

              character = subSequence[k];

              artist.rect(x,totalHeight + 3, ls.basePairDims.width, height - 2, {
                fillStyle: this.highlightColor
              });

              artist.text(_.isObject(character) ? character.sequence[character.position] : character, x, totalHeight + height, {backgroundFillStyle: this.textColor,
                                                                                                                                font: "15px Monospace" });

              x += ls.basePairDims.width;
              if ((Math.abs(baseRange[0]-this.sequenceCanvas.getBaseFromXYPos(x,y))) % ls.basesPerBlock === 0) x += ls.gutterWidth;
          }
        }

    };

  return Highlight;
});