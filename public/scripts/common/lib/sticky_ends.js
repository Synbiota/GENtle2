
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
}];

_.each(stickyEnds, (stickyEnd) => stickyEnd.name = `${stickyEnd.start.name}-${stickyEnd.end.name}`);

export default stickyEnds;
