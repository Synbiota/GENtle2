import Line from './line';
/**
Blank line for SequenceCanvas. Nothing is drawn.
Options are: 

- `this.height`: line height
@class Lines.Blank
@extends Lines.Line
@module Sequence
@submodule SequenceCanvas
**/
export default class Blank extends Line {
  draw() {}
}