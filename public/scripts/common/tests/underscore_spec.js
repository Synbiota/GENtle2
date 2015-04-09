
describe('deepClone test', function() {
  it('should correctly deepClone an object in an array nested in an object', function() {
    var a = {c:[{}]};
    var b = _.deepClone(a);
    b.c[0].d = 1;
    expect(a.c[0].d).toBeUndefined();
  });
});
