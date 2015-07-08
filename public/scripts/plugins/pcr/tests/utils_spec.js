import {transformStickyEndData} from '../lib/utils';
import allStickyEnds from '../../../common/lib/sticky_ends';


describe('pcr utils', function() {
  it('should leave already correct stickyEnd data unaltered', function() {
    var transformedStickyEndData = transformStickyEndData(allStickyEnds()[0]);
    expect(transformedStickyEndData).toEqual(allStickyEnds()[0]);
  });
});
