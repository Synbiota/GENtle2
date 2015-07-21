import RdpEdit from '../rdp_edit';


describe('RdpEdit', function() {
  it('should error if type is undefined', function() {
    expect(function() {
      return new RdpEdit({message: 'Some warning state.', type: undefined, level: RdpEdit.levels.WARN});
    }).toThrowError(TypeError, 'type cannot be: "undefined"');
  });

  it('should instantiate', function() {
    var rdpEdit = new RdpEdit({message: 'Some warning state.', type: 'SOME_OLD_TYPE', level: RdpEdit.levels.WARN});
    expect(rdpEdit.level).toEqual(RdpEdit.levels.WARN);
  });
});
