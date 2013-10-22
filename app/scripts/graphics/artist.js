/**
  
Provides tools for drawing handling canvasses

@class Artist
@constructor
**/
define(function(){
  function Artist(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }

  /**
  @method text
  @param {String} text
  @param {Integer} posX
  @param {Integer} posY
  **/
  Artist.prototype.text = function(text, posX, posY) {
    this.context.fillText(text, posX, posY);
  };

  return Artist;
});