import Handlers from '../lib/_sequence_canvas_handlers';
import Sequence from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';


describe('handling keyboard selection events', function() {
  stubCurrentUser();

  var stickEndSequence = 'GAAGA';
  var mockSequence = new Sequence({
    name: 'Test sequence',
    sequence: 'ATGCATGCATGCATGCATGC' + stickEndSequence,
    stickyEnds: {
      end: {
        sequence: stickEndSequence,
        reverse: true,
        offset: 2,
        size: 3,
        name: "Z'",
      }
    }
  });

  it('selects to end of sequence on that line', function() {
    var handler = new Handlers();
    handler.sequence = mockSequence;
    handler.caretPosition = 10;
    handler.layoutHelpers = {basesPerRow: 120};
    handler.selection = undefined;
    handler.select = function(){};
    spyOn(handler, 'select');

    handler.handleRightKey(true, true);
    expect(handler.select).toHaveBeenCalled();
    expect(handler.select).toHaveBeenCalledWith(10, 19);
  });

  it('does not create selection went at end of sequence', function() {
    var handler = new Handlers();
    handler.sequence = mockSequence;
    handler.caretPosition = 20;
    handler.layoutHelpers = {basesPerRow: 120};
    handler.selection = undefined;
    handler.select = function(){};
    spyOn(handler, 'select');

    handler.handleRightKey(true, true);
    expect(handler.select).not.toHaveBeenCalled();
  });

  it('selects correctly went all of sequence selected to left then right', function() {
    var handler = new Handlers();
    handler.sequence = mockSequence;
    handler.caretPosition = 10;
    handler.layoutHelpers = {basesPerRow: 120};
    handler.selection = undefined;
    handler.select = function(){};
    spyOn(handler, 'select');

    handler.handleLeftKey(true, true);
    expect(handler.select).toHaveBeenCalledWith(0, 9);
    handler.handleRightKey(true, true);
    // TODO: fix this
    // expect(handler.select).toHaveBeenCalledWith(0, 9, 10, 19);
  });
});
