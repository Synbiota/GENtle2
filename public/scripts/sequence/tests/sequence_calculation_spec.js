import {checkForPolyN, gcContent} from '../lib/sequence_calculations';


describe('checkForPolyN', function() {
  it('should have found a polyN sequence', function() {
    expect(checkForPolyN('AAAAAA', {maxPolyN: 5})).toBeTruthy();
  });

  it('should have found a polyN sequence', function() {
    expect(checkForPolyN('GGGGGG', {maxPolyN: 5})).toBeTruthy();
  });

  it('should not have found a polyN sequence', function() {
    expect(!checkForPolyN('AAAAA', {maxPolyN: 5})).toBeTruthy();
  });

  it('should not have found a polyN sequence', function() {
    expect(!checkForPolyN('GGGGG', {maxPolyN: 5})).toBeTruthy();
  });

  it('should not have found a polyN sequence', function() {
    expect(!checkForPolyN('AAAGAAA', {maxPolyN: 5})).toBeTruthy();
  });
});


describe('checkForPolyN failEarly', function() {
  it('should not fail early', function() {
    var result = checkForPolyN('AAAGGG', {maxPolyN: 2});
    expect(result.repeatedBase).toEqual('G');
    expect(result.location).toEqual(3);
    expect(result.repeated).toEqual(3);
  });

  it('should fail early', function() {
    var result = checkForPolyN('AAAGGG', {maxPolyN: 2, failEarly: true});
    expect(result.repeatedBase).toEqual('A');
    expect(result.location).toEqual(0);
    expect(result.repeated).toEqual(3);
  });
});


describe('gcContent', function() {
  it('expects 0 GC content', function() {
    expect(gcContent('AA')).toEqual(0);
  });

  it('expects 1 GC content', function() {
    expect(gcContent('GG')).toEqual(1);
  });

  it('expects 0.5 GC content', function() {
    expect(gcContent('AG')).toEqual(0.5);
  });
});
