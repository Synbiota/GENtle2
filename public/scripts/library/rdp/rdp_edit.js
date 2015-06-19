import _ from 'underscore';


/**
 * @class RdpEdit
 */
class RdpEdit {
  constructor(type, contextBefore, contextAfter, error=undefined) {
    this.type = type;
    if(!_.chain(RdpEdit.types).values().contains(this.type)) throw new TypeError('type is unknown: ' + type);
    this.contextBefore = contextBefore;
    this.contextAfter = contextAfter;
    this.error = error;
  }
}


RdpEdit.types = {
  MULTIPLE_OF_3: 'RDP_EDIT_MULTIPLE_OF_3',
  METHIONINE_START_CODON: 'RDP_EDIT_METHIONINE_START_CODON',
  NO_TERMINAL_STOP_CODON: 'RDP_EDIT_NO_TERMINAL_STOP_CODON',
  TERMINAL_C_BASE: 'RDP_EDIT_TERMINAL_C_BASE',
};


export default RdpEdit;
