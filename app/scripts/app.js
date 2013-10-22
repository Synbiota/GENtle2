/**
Gentle app definition.

Modules are registered here, along with their positioning in the layout.

The app is stored in `window.gentle` for global access.

@class App
@extends EventedObject, Gentle
**/

require(
    ['jquery', 'utils/evented_object', 'utils/functional', 'models/gentle', 'views/layout', 'models/sequence', 'graphics/sequence_canvas', 'domReady'], 
    function($, EventedObject, fun, Gentle, Layout, Sequence, SequenceCanvas, domReady) {

  // Defines the App class as an extension of EventedObject generic class and Gentle model)
  App = fun.extend(Gentle);

  // Creates a globally-accessible new instance of the App Class
  window.gentle = new App({
    layout: new Layout()
  });

  domReady(function() {
    // Register an instance of the Canvas module as View
    gentle.registerModuleInLayout(SequenceCanvas, {type: 'displayMode'});

    // Adds a new sequence as the current sequence
    gentle.currentSequence = new Sequence('ATTTACGATTTACGATTTTAGGCCCAAAATTTGC');

    // Notifies everybody that we are ready to roll
    gentle.triggerOnce('ready');
  });
});