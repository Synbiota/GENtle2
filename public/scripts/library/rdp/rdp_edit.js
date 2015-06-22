import _ from 'underscore';
import RdpSequenceFeature from './rdp_sequence_feature';


/**
 * @class RdpEdit
 */
class RdpEdit {
  /**
   * @constructor
   * @param  {Object} attributes  Object containing the following keys:
   * @param  {String} attributes.type
   * @param  {Object or RdpSequenceFeature} attributes.contextBefore=undefined
   * @param  {Object or RdpSequenceFeature} attributes.contextAfter=undefined
   * @param  {String} attributes.error=undefined
   */
  constructor({type, contextBefore, contextAfter, error}) {
    this.type = type;
    if(!_.chain(RdpEdit.types).values().contains(this.type)) throw new TypeError('type is unknown: ' + type);
    if(contextBefore && !(contextBefore instanceof RdpSequenceFeature)) {
      contextBefore = new RdpSequenceFeature(contextBefore);
    }
    if(contextAfter && !(contextAfter instanceof RdpSequenceFeature)) {
      contextAfter = new RdpSequenceFeature(contextAfter);
    }
    this.contextBefore = contextBefore;
    this.contextAfter = contextAfter;
    this.error = error;
    if((!this.error) && (!(this.contextBefore || this.contextAfter))) {
      throw new TypeError('Must provide "error" or at least one of "contextBefore" or "contextAfter"');
    }
  }
}


RdpEdit.types = {
  MULTIPLE_OF_3: 'RDP_EDIT_MULTIPLE_OF_3',
  METHIONINE_START_CODON: 'RDP_EDIT_METHIONINE_START_CODON',
  NO_TERMINAL_STOP_CODON: 'RDP_EDIT_NO_TERMINAL_STOP_CODON',
  TERMINAL_C_BASE: 'RDP_EDIT_TERMINAL_C_BASE',
};


export default RdpEdit;
