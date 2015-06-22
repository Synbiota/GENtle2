import {transformStickyEndData} from '../lib/utils';
import stickyEnds from '../../../common/lib/sticky_ends';


var getOldStickyEndAttributesXZp = function() {
  return {
    name: "X-Z'",
    startName: "X",
    endName: "Z'",
    start: "CCTGCAGTCAGTGGTCTCTAGAG",
    end: "GAGATGAGACCGTCAGTCACGAG",
    startOffset: 19,
    endOffset: -19
  };
};


var getOldStickyEndAttributesZXp = function() {
  return {
    name: "Z-X'",
    startName: "Z",
    endName: "X'",
    start: "GAGATGAGACCGTCAGTCACGAG",
    end: "CCTGCAGTCAGTGGTCTCTAGAG",
    startOffset: 0,
    endOffset: 0
  };
};


describe('pcr utils', function() {
  // TODO remove those tests and the functions they are testing
  // it("should correctly transform old X-Z' stickyEnd data", function() {
  //   var transformedStickyEndData = transformStickyEndData(getOldStickyEndAttributesXZp());
  //   expect(transformedStickyEndData).toEqual(stickyEnds()[0]);
  // });

  // it("should correctly transform old Z-X' stickyEnd data", function() {
  //   var transformedStickyEndData = transformStickyEndData(getOldStickyEndAttributesZXp());
  //   expect(transformedStickyEndData).toEqual(stickyEnds()[1]);
  // });

  it('should leave already correct stickyEnd data unaltered', function() {
    var transformedStickyEndData = transformStickyEndData(stickyEnds()[0]);
    expect(transformedStickyEndData).toEqual(stickyEnds()[0]);
  });
});
