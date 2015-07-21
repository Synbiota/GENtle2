// TODO add dependency for underscore mixin
import _ from 'underscore';

var RdpTypes = {};


var XZ = "X-Z'";
var ZX = "Z-X'";
var BOTH = [XZ, ZX];

RdpTypes.pcrTypes = {
  CDS: {
    stickyEnds: [XZ],
  },
  MODIFIER: {
    stickyEnds: BOTH, // We should favour XZ
  },
  OTHER: {
    stickyEnds: BOTH,
  },
};
_.deepFreeze(RdpTypes.pcrTypes);


RdpTypes.oligoTypes = {
  RBS: {
    stickyEnds: [ZX],
  },
  TERMINATOR: {
    stickyEnds: [ZX],
  },
  MODIFIER: {
    stickyEnds: BOTH,
  },
  PROTEIN_LINKER: {
    stickyEnds: [ZX],
  },
  PROMOTER: {
    stickyEnds: BOTH,
  },
  OPERATOR: {
    stickyEnds: BOTH,
  },
  OTHER: {
    stickyEnds: BOTH,
  },
};
_.deepFreeze(RdpTypes.oligoTypes);


var types = _.keys(RdpTypes.pcrTypes).concat(_.keys(RdpTypes.oligoTypes));
RdpTypes.types = _.reduce(types, (memo, val) => {
  memo[val] = val;
  return memo;
}, {});
_.deepFreeze(RdpTypes.types);


RdpTypes.meta = {
  proteinCoding: [
    RdpTypes.types.CDS,
    RdpTypes.types.MODIFIER,
    RdpTypes.types.PROTEIN_LINKER,
  ]
};


RdpTypes.availablePartTypes = function(isPcrPart, isOligoPart) {
  var partTypes = {};
  if(isPcrPart) {
    partTypes = RdpTypes.pcrTypes;
  } else if(isOligoPart) {
    partTypes = RdpTypes.oligoTypes;
  }
  return _.keys(partTypes);
};


RdpTypes.availableStickyEnds = function(partType, isPcrPart, isOligoPart) {
  var stickyEnds = [];
  if(isPcrPart) {
    stickyEnds = RdpTypes.pcrTypes[partType].stickyEnds;
  } else if(isOligoPart) {
    stickyEnds = RdpTypes.oligoTypes[partType].stickyEnds;
  }
  return _.clone(stickyEnds);
};


export default RdpTypes;
