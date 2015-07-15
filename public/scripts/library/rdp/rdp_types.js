// TODO add dependency for underscore mixin

var RdpTypes = {};


var CDS = 'CDS';
var MODIFIER = 'MODIFIER';
var OTHER = 'OTHER';
var RBS = 'RBS';
var TERMINATOR = 'TERMINATOR';
var PROTEIN_LINKER = 'PROTEIN_LINKER';
var PROMOTER = 'PROMOTER';
var OPERATOR = 'OPERATOR';

var XZ = "X-Z'";
var ZX = "Z-X'";
var BOTH = [XZ, ZX];

RdpTypes.pcrTypes = {
  CDS: {
    name: CDS,
    stickyEnds: [XZ],
  },
  MODIFIER: {
    name: MODIFIER,
    stickyEnds: BOTH,
  },
  OTHER: {
    name: OTHER,
    stickyEnds: BOTH,
  },
};
_.deepFreeze(RdpTypes.pcrTypes);


RdpTypes.oligoTypes = {
  RBS: {
    name: RBS,
    stickyEnds: [ZX],
  },
  TERMINATOR: {
    name: TERMINATOR,
    stickyEnds: [ZX],
  },
  MODIFIER: {
    name: MODIFIER,
    stickyEnds: BOTH,
  },
  PROTEIN_LINKER: {
    name: PROTEIN_LINKER,
    stickyEnds: [ZX],
  },
  PROMOTER: {
    name: PROMOTER,
    stickyEnds: BOTH,
  },
  OPERATOR: {
    name: OPERATOR,
    stickyEnds: BOTH,
  },
  OTHER: {
    name: OTHER,
    stickyEnds: BOTH,
  },
};
_.deepFreeze(RdpTypes.oligoTypes);


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
