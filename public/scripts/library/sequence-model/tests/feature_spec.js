import SequenceFeature from '../feature';


describe('sequence feature', function() {
  var oldFeature = function() {
    return {
      _id: 1,
      _type: "note",
      desc: "some description",
      name: "t8",
      protein: "CD48",
      ranges: [
      {
        from: 6,
        to: 7,
        reverseComplement: false,
      },
      {
        from: 16,
        to: 14,
        reverseComplement: true,
      }
      ]
    };
  }

  it('should make a new feature with correct ranges from an old feature', function() {
    var sequenceFeature = SequenceFeature.newFromOld(oldFeature());
    expect(sequenceFeature.ranges[0].from).toEqual(6);
    expect(sequenceFeature.ranges[0].size).toEqual(2);
    expect(sequenceFeature.ranges[0].to).toEqual(8);
    expect(sequenceFeature.ranges[0].reverse).toEqual(false);
    expect(sequenceFeature.ranges[1].from).toEqual(15);
    expect(sequenceFeature.ranges[0].size).toEqual(2);
    expect(sequenceFeature.ranges[1].to).toEqual(17);
    expect(sequenceFeature.ranges[1].reverse).toEqual(true);
  });

  it('should copy other attributes from an old feature', function() {
    var sequenceFeature = SequenceFeature.newFromOld(oldFeature());
    expect(sequenceFeature._id).toEqual(1);
    expect(sequenceFeature._type).toEqual('note');
    expect(sequenceFeature.desc).toEqual('some description');
    expect(sequenceFeature.name).toEqual('t8');
    expect(sequenceFeature.protein).toEqual('CD48');
  });
});
