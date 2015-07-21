import _ from 'underscore';
import RdpSequenceFeature from './rdp_sequence_feature';


var NORMAL = 'NORMAL';

/**
 * @class RdpEdit
 */
class RdpEdit {
  /**
   * @constructor
   * @param  {Object} attributes  Object containing the following keys:
   * @param  {String} attributes.type
   * @param  {String} attributes.subType
   * @param  {undefined or Object or RdpSequenceFeature} attributes.contextBefore=undefined
   * @param  {undefined or Object or RdpSequenceFeature} attributes.contextAfter=undefined
   * @param  {String} attributes.message=undefined
   * @param  {String} attributes.level=undefined
   */
  constructor({type, subType, contextBefore, contextAfter, message, level = NORMAL}={}) {
    this.type = type;
    if(!this.type) throw new TypeError(`type cannot be: "${type}"`);
    if(!_.contains(_.values(RdpEdit.types), this.type)) {
      // throw new TypeError('type is unknown: ' + type);
    }
    this.subType = subType;
    if(contextBefore && !(contextBefore instanceof RdpSequenceFeature)) {
      contextBefore = new RdpSequenceFeature(contextBefore);
    }
    if(contextAfter && !(contextAfter instanceof RdpSequenceFeature)) {
      contextAfter = new RdpSequenceFeature(contextAfter);
    }
    this.contextBefore = contextBefore;
    this.contextAfter = contextAfter;
    this.message = message;
    this.level = level;
    if((!this.message) && (!(this.contextBefore || this.contextAfter))) {
      throw new TypeError('Must provide "message" or at least one of "contextBefore" or "contextAfter"');
    }
  }
}


RdpEdit.types = {
  // invalid sequence
  NOT_MULTIPLE_OF_3:                'NOT_MULTIPLE_OF_3',
  STICKY_ENDS_PRESENT:              'STICKY_ENDS_PRESENT',
  SEQUENCE_TOO_SHORT:               'SEQUENCE_TOO_SHORT',

  // RDP compliance edit types
  METHIONINE_START_CODON:           'METHIONINE_START_CODON',
  METHIONINE_START_CODON_CONVERTED: 'METHIONINE_START_CODON_CONVERTED',
  METHIONINE_START_CODON_ADDED:     'METHIONINE_START_CODON_ADDED',
  TERMINAL_STOP_CODON_REMOVED:      'TERMINAL_STOP_CODON_REMOVED',
  LAST_BASE_IS_C:                   'LAST_BASE_IS_C',
  LAST_BASE_IS_C_NO_AA_CHANGE:      'LAST_BASE_IS_C_NO_AA_CHANGE',
  LAST_BASE_IS_G:                   'LAST_BASE_IS_G',
  LAST_BASE_IS_G_NO_AA_CHANGE:      'LAST_BASE_IS_G_NO_AA_CHANGE',

  // RDP warnings
  EARLY_STOP_CODON:                 'EARLY_STOP_CODON',
};


RdpEdit.levels = {
  NORMAL,
  WARN:   'WARN',
  ERROR:  'ERROR',
};


export default RdpEdit;
