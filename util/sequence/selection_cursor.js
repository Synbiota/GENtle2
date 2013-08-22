/*
 * Based on github.com/grassator/canvas-text-editor
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
  if (parseInt(this.el.style.opacity, 10)) {
    this.el.style.opacity = 0;
  } else {
    this.el.style.opacity = 1;
  }
};

/**
 * Shows or hides cursor.
 * @param {void} visible Whether cursor should be visible
 */
SelectionCursor.prototype.setVisible = function(visible) {
  clearInterval(this.interval);
  if(visible) {
    this.el.style.display = 'block';
    this.el.style.opacity = 1;
    this.interval = setInterval(this.blink.bind(this), this.blinkInterval);
  } else {
    this.el.style.display = 'none';
  }
  this.visible = visible;
};