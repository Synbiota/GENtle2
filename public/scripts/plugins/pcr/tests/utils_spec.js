import {transformStickyEndData} from '../lib/utils';
import {stickyEnds} from '../../../common/lib/sticky_ends';


var getOldStickyEndAttributes = function() {
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


describe('pcr utils', function() {
  it('should correctly transform old stickyEnd data', function() {
    var transformedStickyEndData = transformStickyEndData(getOldStickyEndAttributes());
    expect(transformedStickyEndData).toEqual(stickyEnds()[0]);
  });

  it('should leave already correct stickyEnd data unaltered', function() {
    var transformedStickyEndData = transformStickyEndData(stickyEnds()[0]);
    expect(transformedStickyEndData).toEqual(stickyEnds()[0]);
  });
});
