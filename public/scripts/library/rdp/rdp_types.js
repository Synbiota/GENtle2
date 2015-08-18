// TODO add dependency for underscore mixin
import _ from 'underscore';

var RdpTypes = {};


var XZ = "X-Z'";
var ZX = "Z-X'";
var BOTH = [XZ, ZX];

RdpTypes.pcrTypes = {
  CDS: {
    stickyEndNames: [XZ],
  },
  CDS_WITH_STOP: {
    stickyEndNames: [XZ],
  },
  MODIFIER: {
    stickyEndNames: BOTH, // We should favour XZ
  },
  PROMOTER: {
    stickyEndNames: BOTH,
  },
  OTHER: {
    stickyEndNames: BOTH,
  },
};
_.deepFreeze(RdpTypes.pcrTypes);


RdpTypes.oligoTypes = {
  RBS: {
    stickyEndNames: [ZX],
  },
  TERMINATOR: {
    stickyEndNames: [ZX],
  },
  MODIFIER: {
    stickyEndNames: BOTH,
  },
  PROTEIN_LINKER: {
    stickyEndNames: [ZX],
  },
  PROMOTER: {
    stickyEndNames: BOTH,
  },
  OPERATOR: {
    stickyEndNames: BOTH,
  },
  OTHER: {
    stickyEndNames: BOTH,
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
    RdpTypes.types.CDS_WITH_STOP,
    RdpTypes.types.MODIFIER,
    RdpTypes.types.PROTEIN_LINKER,
  ]
};


export default RdpTypes;
