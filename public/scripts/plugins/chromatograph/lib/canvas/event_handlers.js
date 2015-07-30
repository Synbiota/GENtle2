import _ from 'underscore';
// import Hotkeys from '../../common/lib/hotkeys';
// import Modal from '../../common/views/modal_view';

/**
Event handlers for SequenceCanvas
@class SequenceCanvasHandlers
**/

export default class Handlers {
  _init(options) {
    _.bindAll(this,
      'handleScrolling'
    );

  }


  /**
  Handles scrolling events
  @method handleScrolling
  **/

  handleScrolling(event) {
    var $target = $(event.delegateTarget)
    this.onScroll($target.scrollLeft(), $target.scrollTop());
  }

}
