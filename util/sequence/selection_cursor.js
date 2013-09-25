/*
 * Based on selector from:
 * github.com/grassator/canvas-text-editor
 * Copyright (c) 2012 Dmitriy Kubyshkin
 * ---------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and 
 * associated documentation files (the "Software"), to deal in the Software without restriction, including 
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the 
 * following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 */


 /**
 * Creates new selection for a sequence canvas.
 * @param {start} start, @param {end} end.
 * @constructor
 */

SelectionCursor = function(start, end){
  this.start = start | 0;
  this.end = end | 0;
  this.line = false;
  this.ctx = false;
  this.blink_vis = false;
  this.overwrite = false;
}


SelectionCursor.prototype.toggleOverwrite = function(){
  this.overwrite = !this.overwrite;
}

SelectionCursor.prototype.setStart = function(start){
  this.start = start;
}

SelectionCursor.prototype.setEnd = function(end){
  this.end = end;
}

SelectionCursor.prototype.getSelection = function(){
  if (this.start < this.end){
    return [{ from : this.start , to : this.end - 1, fcol : '#CCCCCC' , tcol : 'black'}] ;
  } else if (this.start > this.end){
    return [{ from : this.end , to : this.start-1, fcol : '#CCCCCC' , tcol : 'black'}] ;
  } else {
    return [] ; 
  }
}

SelectionCursor.prototype.getBase = function(){
  return this.end;
}

SelectionCursor.prototype.updateLocation = function ( x , y ){
  this.x = x;
  this.y = y;
}


SelectionCursor.prototype.setContext = function ( ctx ){
  this.ctx = ctx;
}


/**
 * Hold blink interval for the cursor
 * @type {Number}
 */
SelectionCursor.prototype.blinkInterval = 500;

/**
 * This callback called when selection size has changed
 * @type {Function}
 */
SelectionCursor.prototype.onchange = null;

/**
 * If true that means that we currently manipulate right side of the selection
 * @type {Boolean}
 */
SelectionCursor.prototype.activeEndSide = true;




/**
 * Responsible for blinking
 * @return {void}
 */
SelectionCursor.prototype.blink = function() {
  if (this.blink_vis) {
    this.ctx.clearRect ( 0 , 0 , this.ctx.canvas.width , this.ctx.canvas.height );
    this.blink_vis = false;
  } else {
    this.ctx.fillStyle = "black";
    if (this.overwrite){
      this.ctx.fillRect (this.x-1 , this.y + 13 , 9 , 1 ) ;
    }else{
      this.ctx.fillRect (this.x-1 , this.y - 4 , 1 , 19 ) ;
    }
    this.blink_vis = true;
  }
};

/**
 * Shows or hides cursor.
 * @param {void} visible Whether cursor should be visible
 */
SelectionCursor.prototype.setVisible = function(visible) {
  clearInterval(this.interval);
  if(visible) {
    this.ctx.fillStyle = "black";
    if (this.overwrite){
      this.ctx.fillRect (this.x-1 , this.y + 13 , 9 , 1 ) ;
    }else{
      this.ctx.fillRect (this.x-1 , this.y - 4 , 1 , 19 ) ;
    }
    this.blink_vis = true;
    this.interval = setInterval(this.blink.bind(this), this.blinkInterval);
  } else {
    this.ctx.clearRect ( 0 , 0 , this.ctx.canvas.width , this.ctx.canvas.height );
  }
  this.visible = visible;
};