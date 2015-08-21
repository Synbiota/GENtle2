import {numberOfSimilarBases} from '../index';


describe('numberOfSimilarBases', function() {
  var sequenceBases1 = 'AAAGTGAT';
  var sequenceBases2 =    'GTGACAAT';
  it('should work forwards with +ve offset', function() {
    var similar = numberOfSimilarBases(sequenceBases1, sequenceBases2, 3, 4);
    expect(similar).toEqual(3);
  });

  it('should work forwards with -ve offset', function() {
    var similar = numberOfSimilarBases(sequenceBases2, sequenceBases1, -3, 2);
    expect(similar).toEqual(2);
  });

  it('should work backwards with +ve offset', function() {
    var similar = numberOfSimilarBases(sequenceBases1, sequenceBases2, 3, 4, false);
    expect(similar).toEqual(2);
  });

  it('should work backwards with -ve offset', function() {
    var similar = numberOfSimilarBases(sequenceBases2, sequenceBases1, -3, 2, false);
    expect(similar).toEqual(3);
  });

  it('should return when given values out of range', function() {
    var similar = numberOfSimilarBases(sequenceBases2, sequenceBases1, -3, 20, false);
    expect(similar).toEqual(0);
  });
});

