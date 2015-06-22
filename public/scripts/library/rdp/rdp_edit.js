import _ from 'underscore';
import RdpSequenceFeature from './rdp_sequence_feature';


/**
 * @class RdpEdit
 */
class RdpEdit {
  /**
   * @constructor
   * @param  {String} options.type
   * @param  {Object or RdpSequenceFeature} options.contextBefore
   * @param  {Object or RdpSequenceFeature} options.contextAfter
   * @param  {String or undefined} options.error
   */
  constructor({type, contextBefore, contextAfter, error}) {
    this.type = type;
    if(!_.chain(RdpEdit.types).values().contains(this.type)) throw new TypeError('type is unknown: ' + type);
    if(!(contextBefore instanceof RdpSequenceFeature)) {
      contextBefore = new RdpSequenceFeature(contextBefore);
    }
    if(!(contextAfter instanceof RdpSequenceFeature)) {
      contextAfter = new RdpSequenceFeature(contextAfter);
    }
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
