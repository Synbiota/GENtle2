/**
Extends the Object type with a form of prototypal inheritance
and returns the EventEmitter class.
@class BaseClass
**/
define(['eventEmitter', 'utils/inheritance'], function(EventEmitter) {
  return EventEmitter;
});