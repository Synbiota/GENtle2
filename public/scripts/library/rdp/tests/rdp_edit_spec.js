import RdpEdit from '../rdp_edit';


describe('RdpEdit', function() {
  it('should error if type is undefined', function() {
    expect(function() {
      new RdpEdit();
    }).toThrowError(TypeError, 'type is unknown: undefined');
  });
});
