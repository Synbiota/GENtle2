
var stickyEnds = [{
  start: {
    sequence: 'CCTGCAGTCAGTGGTCTCTAGAG',
    reverse: false,
    offset: 19,
    size: 4,
    name: "X",
  },
  end: {
    sequence: 'GAGATGAGACCGTCAGTCACGAG',
    reverse: true,
    offset: 19,
    size: 4,
    name: "Z'",
  }
},
{
  start: {
    sequence: 'GAGATGAGACCGTCAGTCACGAG',
    reverse: false,
    offset: 0,
    size: 4,
    name: "Z",
  },
  end: {
    sequence: 'CCTGCAGTCAGTGGTCTCTAGAG',
    reverse: true,
    offset: 0,
    size: 4,
    name: "X'",
  }
}
];

_.each(stickyEnds, (stickyEnd) => stickyEnd.name = `${stickyEnd.start.name}-${stickyEnd.end.name}`);

var getStickyEnds = function() {
  return _.deepClone(stickyEnds);
};

export default getStickyEnds;
