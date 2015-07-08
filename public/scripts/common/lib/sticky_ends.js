
var stickyEnds = [{
  start: {
    sequence: 'TCAGTCAGTCAGTCAGGGTCTCAGATG',
    reverse: false,
    offset: 23,
    size: 4,
    name: "X",
  },
  end: {
    sequence: 'CGGCAGAGACCTCAGTCAGTCAGTCAG',
    reverse: true,
    offset: 23,
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

var getStickyEnds = function() {
  return _.deepClone(stickyEnds);
};

export default getStickyEnds;
