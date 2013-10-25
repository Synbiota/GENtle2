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
  @method set canvas dimensions
  @param {Integer} Width
  @param {Integer} Height
  **/
  Artist.prototype.setDimensions = function(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  };

  /**
  @method clear
  **/
  Artist.prototype.clear = function(bg) {
    if(typeof(bg)==='undefined') bg = "#FFF";
    this.context.fillStyle = bg;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  };

  /**
  @method fillRect
  @param {Integer} x
  @param {Integer} y
  @param {Integer} width
  @param {Integer} height
  **/
  Artist.prototype.clear = function(x,y,width,height) {
    this.context.fillRect(x, y, width, height);
  };

  /**
  @method text
  @param {String} text
  @param {Integer} posX
  @param {Integer} posY
  **/
  Artist.prototype.text = function(text, posX, posY, colour) {
    if(typeof(colour)==='undefined') colour = "#000";
    this.context.fillStyle = colour;
    this.context.fillText(text, posX, posY);
  };

  return Artist;
});