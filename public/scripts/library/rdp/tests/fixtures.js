
var stickyEndsXZ = function() {
  return {
    start: {
      sequence: 'C' + 'GATG',
      reverse: false,
      offset: 1,
      size: 4,
      name: "X",
    },
    end: {
      sequence: 'CGGC' + 'TA',
      reverse: true,
      offset: 2,
      size: 4,
      name: "Z'",
    },
    name: "X-Z'",
  };
};

var stickyEndsZX = function() {
  return {
    start: {
      sequence: 'TA' + 'CGGC',
      reverse: false,
      offset: 2,
      size: 4,
      name: "Z",
    },
    end: {
      sequence: 'GATG' + 'C',
      reverse: true,
      offset: 1,
      size: 4,
      name: "X'",
    },
    name: "Z-X'",
  };
};


export default {
  stickyEndsXZ,
  stickyEndsZX,
};
