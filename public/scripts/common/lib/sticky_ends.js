
var stickyEnds = [{
  start: {
    sequence: 'GGTCTCAGATG',
    reverse: false,
    offset: 7,
    size: 4,
    name: "X",
  },
  end: {
    sequence: 'CGGCTGAGACC',
    reverse: true,
    offset: 7,
    size: 4,
    name: "Z'",
  }
},
{
  start: {
    sequence: 'GGTCTCACGGC',
    reverse: false,
    offset: 7,
    size: 4,
    name: "Z",
  },
  end: {
    sequence: 'CTACACTCTGG',
    reverse: true,
    offset: 7,
    size: 4,
    name: "X'",
  }
}
];

_.each(stickyEnds, (stickyEnd) => stickyEnd.name = `${stickyEnd.start.name}-${stickyEnd.end.name}`);

var allStickyEnds = function() {
  return _.deepClone(stickyEnds);
};

export default allStickyEnds;
