

// NOTE:
//   *  All sequences are on the forward strand, 5' to 3'
//   *  TCAGTCAGTCAGTCAGGGTCTCA is shared amongst primers for producing sticky
//      end on forward strand.
//   *  AGAGACCTCAGTCAGTCAGTCAG is shared amongst primers for producing sticky
//      end on reverse strand.
// TODO: move to RDP PCR and oligo-based part plugin
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
    sequence: 'TCAGTCAGTCAGTCAGGGTCTCACGGC',
    reverse: false,
    offset: 23,
    size: 4,
    name: "Z",
  },
  end: {
    sequence: 'GATGAGAGACCTCAGTCAGTCAGTCAG',
    reverse: true,
    offset: 23,
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
