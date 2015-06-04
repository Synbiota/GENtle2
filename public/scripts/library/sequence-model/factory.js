import _ from 'underscore';

import classMethodsMixin from './sequence_class_methods_mixin';
import smartMemoizeAndClear from './smart_memoize_and_clear';
import deprecated from 'gentle-utils/deprecated_method';
import SequenceTransforms from 'gentle-sequence-transforms';

import HistorySteps from '../../sequence/models/history_steps';

const stickyEndFormats = ['full', 'none', 'overhang'];

export default function sequenceModelFactory(BackboneModel) {
  /**
   * Represents a sequence of nucleotides (DNA bases).
   * @class  BaseSequenceModel
   * @constructor
   */
  class Sequence extends BackboneModel {

    constructor(attributes, options) {
      super(attributes, options);

      this.validateFields(attributes);

      this.sortFeatures();

      this.getComplements = _.bind(_.partial(this.getTransformedSubSeq, 'complements', {}), this);

      var defaultStickyEndsEvent = 'change:stickyEnds change:stickyEndFormat';

      smartMemoizeAndClear(this, {
        maxOverlappingFeatures: `change:sequence change:features ${defaultStickyEndsEvent}`,
        nbFeaturesInRange: `change:sequence change:features ${defaultStickyEndsEvent}`,
        getSequence: `change:sequence ${defaultStickyEndsEvent}`,
        getFeatures: `change:features ${defaultStickyEndsEvent}`,
        getStickyEnds: defaultStickyEndsEvent,
        editableRange: `change:sequence ${defaultStickyEndsEvent}`,
        selectableRange: `change:sequence ${defaultStickyEndsEvent}`
      });
    }

    /**
     * Return a list of all possible attribute fields on this model.
     * @method allFields
     * @return {Array<String>}
     */
    get allFields() {
      var allFields = allFields || _.unique(this.requiredFields.concat(this.optionalFields));
      return allFields;
    }

    /**
     * Return a list of all required attribute fields on this model.
     * @method requiredFields
     * @return {Array<String>}
     */
    get requiredFields() {
      return ['sequence'];
    }

    /**
     * Return a list of all optional attribute fields on this model.
     * @method optionalFields
     * @return {Array<String>}
     */
    get optionalFields() {
      return [
        'id',
        'name',
        'desc',
        'stickyEnds',
        'features',
        'reverse',
        'readOnly',
        'isCircular',
        'stickyEndFormat'
      ];
    }

    validateFields(attributes) {
      var attributeNames = _.keys(attributes);
      var missingAttributes = _.without(this.requiredFields, ...attributeNames);
      var extraAttributes = _.without(attributeNames, ...this.allFields);

      if(missingAttributes.length) {
        throw `${this.constructor.name} is missing the following attributes: ${missingAttributes.join(', ')}`;
      }

      if(extraAttributes.length) {
        // console.warn(`Assigned the following disallowed attributes to ${this.constructor.name}: ${extraAttributes.join(', ')}`);
      }
    }

    defaults() {
      return {
        id: _.uniqueId(),
        readOnly: false,
        isCircular: false,
        history: new HistorySteps(),
        stickyEndFormat: 'overhang'
      };
    }

    superGet(attribute) {
      return super.get(attribute);
    }

    /**
     * Wraps the standard get function to use the custom getSequence if necessary.
     * @param  {String} Standard attribute
     * @param  {Object} options=undefined
     */
    get(attribute, options=undefined){
      var value;
      var customGet = "get" + _.ucFirst(attribute);

      if (this[customGet]){
        deprecated(this, `get('${attribute}')`, customGet);
        value = this[customGet](options);
      } else {
        value = super.get(attribute);
      }

      return value;
    }

    getStickyEnds() {
      var stickyEnds = super.get('stickyEnds');
      return stickyEnds && _.defaults({}, stickyEnds, {
        start: {size: 0, offset: 0},
        end: {size: 0, offset: 0}
      });
    }

    getStickyEndFormat() {
      return super.get('stickyEndFormat');
    }

    setStickyEndFormat(value) {
      if(value && !~stickyEndFormats.indexOf(value))
        throw `'${value}' is not an acceptable sticky end format`;
      return this.set('stickyEndFormat', value);
    }

    /**
     * Specialized function for getting the sequence attribute. Varies result depending on value of the `stickyEndFormat` attribute
     * 'none' will return the sequence without sticky ends.
     * 'overhang' will return the sequence with the active section of sticky ends.
     * Default value will return the full (blunt) sticky end.
     * @method  getSequence
     * @return {String} Formatted sequence
     */
    getSequence(){
      var sequence        = super.get('sequence'),
          stickyEnds      = this.getStickyEnds(),
          stickyEndFormat = this.getStickyEndFormat(),
          startPostion, endPosition;

      if (stickyEnds && stickyEndFormat){
        switch (stickyEndFormat){
          case "none":
            startPostion = stickyEnds.start.size + stickyEnds.start.offset;
            endPosition = sequence.length - stickyEnds.end.size - stickyEnds.end.offset;
            break;
          case "overhang":
            startPostion = stickyEnds.start.offset;
            endPosition = sequence.length - stickyEnds.end.offset;
            break;
        }

        if ((startPostion !== undefined) && (endPosition !== undefined)){
          sequence = sequence.substring(startPostion, endPosition);
        }
      }

      return sequence;
    }

    getFeatures(){
      var features = super.get('features'),
          stickyEnds = this.getStickyEnds(),
          stickyEndFormat = this.getStickyEndFormat(),
          length = this.getLength(),
          startStickyEnd, adjust;

      if (stickyEnds){
        startStickyEnd = stickyEnds.start;
      }

      var adjustRanges = function(offset, feature){
        var adjusted = _.deepClone(feature);
        offset = offset || 0;

        _.each(adjusted.ranges, function(range){
          range.from =  Math.max(Math.min(range.from + offset, length -1), 0);
          range.to =  Math.max(Math.min(range.to + offset, length -1), 0);
        });

        return adjusted;
      };

      if (stickyEndFormat && stickyEnds){
        switch (stickyEndFormat){
          case "none":
            adjust = _.partial(adjustRanges, -(startStickyEnd.offset + startStickyEnd.size));
            features = _.map(features, adjust);
            break;
          case "overhang":
            adjust = _.partial(adjustRanges, -startStickyEnd.offset);
            features = _.map(features, adjust);
            break;
        }
      }

      return features;
    }

    /**
    Returns the subsequence between the bases startBase and end Base
    @method getSubSeq
    @param {Integer} startBase start of the subsequence (indexed from 0)
    @param {Integer} endBase end of the subsequence (indexed from 0)
    **/
    getSubSeq(startBase, endBase) {
      if (endBase === undefined){
        endBase = startBase;
      } else {
        if (endBase >= this.getLength() && startBase >= this.getLength()) return '';
        endBase = Math.min(this.getLength() - 1, endBase);
      }
      startBase = Math.min(Math.max(0, startBase), this.getLength() - 1);

      return this.getSequence().substr(startBase, endBase - startBase + 1);

      // endBase = (endBase === undefined) ? startBase + 1 : endBase;
      // return this.get('sequence', options).substring(startBase, endBase);
    }

    /**
     * @method isBeyondStickyEnd
     * @param  {Integer} pos
     * @param  {Boolean} reverse=false If true, assesses reverse strand.
     * @return {Boolean}
     */
    isBeyondStickyEnd(pos, reverse = false) {
      return this.isBeyondStartStickyEnd(pos, reverse) || this.isBeyondEndStickyEnd(pos, reverse);
    }

    /**
     * @method overhangBeyondStartStickyEndOnBothStrands
     * @param  {Integer} pos
     * @return {Integer}
     */
    overhangBeyondStartStickyEndOnBothStrands(pos) {
      return Math.min(this.overhangBeyondStartStickyEnd(pos, true), this.overhangBeyondStartStickyEnd(pos, false));
    }

    /**
     * @method overhangBeyondEndStickyEndOnBothStrands
     * @param  {Integer} pos
     * @return {Integer}
     */
    overhangBeyondEndStickyEndOnBothStrands(pos) {
      return Math.min(this.overhangBeyondEndStickyEnd(pos, true), this.overhangBeyondEndStickyEnd(pos, false));
    }

    /**
     * @method isBeyondStartStickyEnd
     * @param  {Integer} pos
     * @param  {Boolean} reverse=false  If true, assesses reverse strand.
     * @return {Boolean}
     */
    isBeyondStartStickyEnd(pos, reverse) {
      if (reverse === undefined) {
        reverse = false;
      }
      return this.overhangBeyondStartStickyEnd(pos, reverse) > 0;
    }

    /**
     * @method isBeyondStartStickyEndOnBothStrands
     * @param  {Integer} pos
     * @return {Boolean}
     */
    isBeyondStartStickyEndOnBothStrands(pos) {
      return this.overhangBeyondStartStickyEndOnBothStrands(pos) > 0;
    }

    /**
     * @method isBeyondEndStickyEndOnBothStrands
     * @param  {Integer} pos
     * @return {Boolean}
     */
    isBeyondEndStickyEndOnBothStrands(pos) {
      return this.overhangBeyondEndStickyEndOnBothStrands(pos) > 0;
    }

    /**
     * @method isBeyondEndStickyEnd
     * @param  {Integer} pos
     * @param  {Boolean} reverse=false  If true, assesses reverse strand.
     * @return {Boolean}
     */
    isBeyondEndStickyEnd(pos, reverse = false) {
      return this.overhangBeyondEndStickyEnd(pos, reverse) > 0;
    }

     /**
       * @method overhangBeyondStartStickyEnd
       * @param  {Integer} pos
       * @param  {Boolean} reverse=false  If true, assesses reverse strand.
       * @return {Integer}
       */
    overhangBeyondStartStickyEnd(pos, reverse = false) {
      var stickyEnds = this.getStickyEnds();
      var stickyEndFormat = this.getStickyEndFormat();
      var result = 0;

      if(stickyEnds) {
        var startStickyEnd = stickyEnds.start;
        var offset = stickyEndFormat == "overhang" ? 0 : startStickyEnd.offset;

        if(startStickyEnd) {
          if(reverse) {
            if(startStickyEnd.reverse) {
              result = offset - pos;
            } else {
              result = (offset + startStickyEnd.size) - pos;
            }
          } else {
            if(startStickyEnd.reverse) {
              result = (offset + startStickyEnd.size) - pos;
            } else {
              result = offset - pos;
            }
          }
        }
      }
      return result;
    }

    /**
     * @method overhangBeyondEndStickyEnd
     * @param  {Integer} pos
     * @param  {Boolean} reverse=false  If true, assesses reverse strand.
     * @return {Integer}
     */
    overhangBeyondEndStickyEnd(pos, reverse = false) {
      var stickyEnds = this.getStickyEnds();
      var stickyEndFormat = this.getStickyEndFormat();
      var seqLength = this.getLength();
      var result = 0;

      if(stickyEnds) {
        var startStickyEnd = stickyEnds.start;
        var endStickyEnd = stickyEnds.end;

        if(endStickyEnd) {
          var stickyEndTo = seqLength - 1 - endStickyEnd.offset;

          switch (stickyEndFormat){
            case "none":
              stickyEndTo -= (startStickyEnd.offset + startStickyEnd.size);
              break;
            case "overhang":
              stickyEndTo -= startStickyEnd.offset;
              break;
          }


          var stickyEndFrom = stickyEndTo - endStickyEnd.size + 1;

          if(reverse) {
            if(endStickyEnd.reverse) {
              result = pos - stickyEndTo;
            } else {
              result = (pos + 1) - stickyEndFrom;
            }
          } else {
            if(endStickyEnd.reverse) {
              result = (pos + 1) - stickyEndFrom;
            } else {
              result = pos - stickyEndTo;
            }
          }
        }
      }
      return result;
    }

    /**
     * @method getStickyEndSequence
     * @param  {Boolean} getStartStickyEnd
     * @return {Object}
     *        sequenceBases: {String}  sequence bases of stickyEnd (if on reverse
     *                                 strand then complement is taken but not
     *                                 reverse complement)
     *        isOnReverseStrand:  {Boolean}  true if sequence is on reverse strand
     */
    getStickyEndSequence(getStartStickyEnd) {
      var wholeSequence = super.get('sequence');
      var stickyEnds = this.getStickyEnds() || {};
      var isOnReverseStrand;
      var sequenceBases = '';
      var stickyEnd;

      if(getStartStickyEnd) {
        stickyEnd = stickyEnds.start;
        if(stickyEnd) {
          sequenceBases = wholeSequence.substr(stickyEnd.offset, stickyEnd.size);
        }
      } else {
        stickyEnd = stickyEnds.end;
        if (stickyEnd) {
          var offset = wholeSequence.length - (stickyEnd.offset + stickyEnd.size);
          sequenceBases = wholeSequence.substr(offset, stickyEnd.size);
        }
      }

      if(stickyEnd) {
        isOnReverseStrand = stickyEnd.reverse;
        if(isOnReverseStrand) {
          sequenceBases = SequenceTransforms.toComplements(sequenceBases);
        }
      }
      return {sequenceBases, isOnReverseStrand};
    }

    /**
     * @method getStartStickyEndSequence
     * @return {Object}  see `getStickyEndSequence` for description of return type
     */
    getStartStickyEndSequence() {
      return this.getStickyEndSequence(true);
    }

    /**
     * @method getEndStickyEndSequence
     * @return {Object}  see `getStickyEndSequence` for description of return type
     */
    getEndStickyEndSequence() {
      return this.getStickyEndSequence(false);
    }

    /**
     * Returns True if this sequenceModel has a complementary end stickyEnd to the
     * supplied sequenceModel's start stickyEnd
     * @method stickyEndConnects
     * @param  {SequenceModel} sequenceModel
     * @return {Boolean}
     */
    stickyEndConnects (sequence) {
      var thisEndStickySequence = this.getEndStickyEndSequence();
      var otherStartStickySequence = sequence.getStartStickyEndSequence();

      var canConnect = ((thisEndStickySequence.isOnReverseStrand != otherStartStickySequence.isOnReverseStrand) &&
        SequenceTransforms.areComplementary(thisEndStickySequence.sequenceBases, otherStartStickySequence.sequenceBases));

      return canConnect;
    }

    /**
     * @method hasStickyEnds
     * @return {Boolean}
     */
    hasStickyEnds() {
      var stickyEnds = this.getStickyEnds();
      return !!(stickyEnds && stickyEnds.start && stickyEnds.end);
    }

    /**
    Returns a transformed subsequence between the bases startBase and end Base
    @method getTransformedSubSeq
    @param {String} variation name of the transformation
    @param {Object} options
    @param {Integer} startBase start of the subsequence (indexed from 0)
    @param {Integer} endBase end of the subsequence (indexed from 0)
    **/
    getTransformedSubSeq(variation, options, startBase, endBase) {
      options = options || {};
      var output = '';
      switch (variation) {
        case 'aa-long':
        case 'aa-short':
          var paddedSubSeq = this.getPaddedSubSeq(startBase, endBase, 3, options.offset || 0),
            offset;
          output = _.map(paddedSubSeq.subSeq.match(/.{1,3}/g) || [], function(codon) {
            if (options.complements === true) codon = SequenceTransforms.toComplements(codon);
            return SequenceTransforms[variation == 'aa-long' ? 'codonToAALong' : 'codonToAAShort'](codon);
          }).join('');
          offset = Math.max(0, paddedSubSeq.startBase - startBase);
          output = output.substr(Math.max(0, startBase - paddedSubSeq.startBase), endBase - startBase + 1 - offset);
          _.times(Math.max(0, offset), function() {
            output = ' ' + output;
          });
          break;
        case 'complements':
          output = SequenceTransforms.toComplements(this.getSubSeq(startBase, endBase));
          break;
        default:
          throw new Error(`Unsupported sequence transform '${variation}'`);
      }
      return output;
    }

    /**
    Returns a subsequence including the subsequence between the bases `startBase` and `endBase`.
    Ensures that blocks of size `padding` and starting from the base `offset` in the
    complete sequence are not broken by the beginning or the end of the subsequence.
    @method getPaddedSubSeq
    @param {String} variation name of the transformation
    @param {Integer} startBase start of the subsequence (indexed from 0)
    @param {Integer} endBase end of the subsequence (indexed from 0)
    @param {Integer, optional} offset relative to the start of full sequence
    **/
    getPaddedSubSeq(startBase, endBase, padding, offset) {
      offset = offset || 0;
      startBase = Math.max(startBase - (startBase - offset) % padding, 0);
      endBase = Math.min(endBase - (endBase - offset) % padding + padding - 1, this.getLength());
      return {
        subSeq: this.getSubSeq(startBase, endBase),
        startBase: startBase,
        endBase: endBase
      };
    }

    /**
    @method getCodon
    @param {Integer} base
    @param {Integer, optional} offset
    @returns {Object} codon to which the base belongs and position of the base in the codon (from 0)
    **/
    getCodon(base, offset = 0) {
      if(base < 0) throw new Error(`'base' must be >= 0 but was '${base}'`);
      var subSeq = this.getPaddedSubSeq(base, base, 3, offset);
      if (subSeq.startBase > base) {
        return {
          sequence: this.getSequence()[base],
          position: 1
        };
      } else {
        return {
          sequence: subSeq.subSeq,
          position: (base - offset) % 3
        };
      }
    }

    /**
    @method codonToAA
    **/
    getAA(variation, base, offset) {
      var codon = this.getCodon(base, offset || 0),
        aa = SequenceTransforms[variation == 'short' ? 'codonToAAShort' : 'codonToAALong'](codon.sequence) || '';
      return {
        sequence: aa || '   ',
        position: codon.position
      };
    }

    /**
    @method featuresInRange
    @param {integer} startBase
    @param {integer} endBase
    @returns {array} all features present between start and end base
    **/
    featuresInRange(startBase, endBase) {
      var features = this.getFeatures();
      if (_.isArray(features)) {
        return _(features).filter((feature) => {
          return this.filterRanges(startBase, endBase, feature.ranges).length > 0;
        });
      } else {
        return [];
      }
    }

    /**
     * @method filterRanges
     * @param  {integer} startBase
     * @param  {integer} endBase
     * @param  {array} list of feature ranges
     * @return {array} all ranges overlapping start and end base
     */
    filterRanges(startBase, endBase, ranges) {
      return _.filter(ranges, function(range) {
        if(range.from < range.to) {
          return range.from <= endBase && range.to >= startBase;
        } else {
          return range.to <= endBase && range.from >= startBase;
        }
      });
    }

    /**
    Validates that a sequence name is present
    @method validate
    **/
    validate(attrs) {
      var errors = [];
      if (!attrs.name.replace(/\s/g, '').length) {
        errors.push('name');
      }
      return errors.length ? errors : undefined;
    }


    /**
    @method maxOverlappingFeatures
    @returns {integer}
    **/
    maxOverlappingFeatures() {
      var ranges = _.flatten(_.pluck(this.attributes.features, 'ranges')),
        previousRanges = [],
        i = 0,
        filterOverlappingRanges = function(ranges) {
          return _.filter(ranges, function(range) {
            return _.some(ranges, function(testRange) {
              return range != testRange && range.from <= testRange.to && range.to >= testRange.from;
            });
          });
        };

      while(ranges.length > 1 && _.difference(ranges, previousRanges).length && i < 100) {
        previousRanges = _.deepClone(ranges);
        ranges = filterOverlappingRanges(ranges);
        i++;
      }
      return i;
    }

    /**
    @method featuresCountInRange
    @returns {integer}
    **/
    nbFeaturesInRange(startBase, endBase) {
      return _.filter(this.getFeatures(), function(feature) {
        return _.some(feature.ranges, function(range) {
          return range.from <= endBase && range.to >= startBase;
        });
      }).length;
    }

    insertBases(bases, beforeBase, options = {}){
      var seq = super.get('sequence'),
          stickyEnds = this.getStickyEnds(),
          stickyEndFormat = this.getStickyEndFormat(),
          offset = 0,
          adjustedBeforeBase,
          timestamp;

      options = _.defaults(options, {updateHistory: true});

      // Adjust offset depending on sticky end format
      if (stickyEnds && stickyEndFormat){
        switch (stickyEndFormat){
          case "none":
            offset = stickyEnds.start.size + stickyEnds.start.offset;
            break;
          case "overhang":
            offset = stickyEnds.start.offset;
            break;
        }
      }

      adjustedBeforeBase = beforeBase + offset;

      this.set('sequence',
        seq.substr(0, adjustedBeforeBase) +
        bases +
        seq.substr(adjustedBeforeBase, seq.length - (adjustedBeforeBase) + 1)
      );

      this.moveFeatures(beforeBase, bases.length, options);

      if (options.updateHistory) {
        timestamp = this.getHistory().add({
          type: 'insert',
          position: adjustedBeforeBase,
          value: bases,
          operation: '@' + adjustedBeforeBase + '+' + bases
        }).get('timestamp');
      }

      this.throttledSave();

      return timestamp;
    }

    moveBases(firstBase, length, newFirstBase, options = {}) {
      var lastBase = firstBase + length - 1,
          history = this.getHistory(),
          _this = this,
          featuresInRange, subSeq, deletionTimestamp, insertionTimestamp;

      options = _.defaults(options, {updateHistory: true});

      featuresInRange = _.deepClone(_.filter(this.getFeatures(), function(feature) {
        return _.some(feature.ranges, function(range) {
          return range.from >= firstBase && range.to <= lastBase;
        });
      }));

      subSeq = this.getSubSeq(firstBase, lastBase);

      deletionTimestamp = this.deleteBases(firstBase, length, options);
      insertionTimestamp = this.insertBases(
        subSeq,
        newFirstBase < firstBase ?
          newFirstBase :
          newFirstBase - length,
        options
      );

      _.each(featuresInRange, function(feature) {
        feature.ranges = _.map(_.filter(feature.ranges, function(range) {
          return range.from >= firstBase && range.to <= lastBase;
        }), function(range) {
          var offset = newFirstBase < firstBase ?
            newFirstBase - firstBase :
            newFirstBase - length - firstBase;

          return {
            from: range.from + offset,
            to: range.to + offset
          };
        });

        _this.createFeature(feature, options);
      });

    }

    insertBasesAndCreateFeatures(beforeBase, bases, features, options) {
      var newFeatures = _.deepClone(_.isArray(features) ? features : [features]),
          _this = this;

      this.insertBases(bases, beforeBase, options);

      _.each(newFeatures,function(feature){

        feature.ranges = [{
          from: beforeBase,
          to: beforeBase + bases.length - 1
        }];

        delete feature.from;
        delete feature.to;

        _this.createFeature(feature, options);
      });
    }

    insertSequenceAndCreateFeatures(beforeBase, bases, features, options = {}) {
      var newFeatures = _.deepClone(_.isArray(features) ? features : [features]),
          _this = this;

      this.insertBases(bases, beforeBase, options);

      _.each(newFeatures,function(feature){

        feature.ranges = _.map(feature.ranges, function(range) {
          return {
            from: beforeBase + range.from,
            to: beforeBase + range.to
          };
        });

        _this.createFeature(feature, options);
      });
    }

    deleteBases(firstBase, length, options = {}) {
      var seq = super.get('sequence'),
          stickyEnds = this.getStickyEnds(),
          stickyEndFormat = this.getStickyEndFormat(),
          offset = 0,
          adjustedFirstBase,
          timestamp,
          subseq, linkedHistoryStepTimestamps;

      options = _.defaults(options, {updateHistory: true});

      // Adjust offset depending on sticky end format
      if (stickyEnds && stickyEndFormat){
        switch (stickyEndFormat){
          case "none":
            offset = stickyEnds.start.size + stickyEnds.start.offset;
            break;
          case "overhang":
            offset = stickyEnds.start.offset;
            break;
        }
      }

      adjustedFirstBase = firstBase + offset;

      subseq = seq.substr(adjustedFirstBase, length);

      this.set('sequence',
        seq.substr(0, adjustedFirstBase) +
        seq.substr(adjustedFirstBase + length, seq.length - (adjustedFirstBase + length - 1))
      );

      // moveFeatures manages the adjustment.
      linkedHistoryStepTimestamps = this.moveFeatures(firstBase, -length, options);

      // if (updateHistory === 'design-true')
      //   this.getHistory().add({
      //     type: 'design-delete',
      //     value: subseq,
      //     hidden: true,
      //     position: adjustedFirstBase,
      //     operation: '@' + adjustedFirstBase + '-' + subseq,
      //     linked: linkedHistoryStepTimestamps
      //   });

      if (options.updateHistory) {
        timestamp = this.getHistory().add({
          type: 'delete',
          value: subseq,
          position: adjustedFirstBase,
          operation: '@' + adjustedFirstBase + '-' + subseq,
          linked: linkedHistoryStepTimestamps
        }).get('timestamp');
      }

      this.throttledSave();

      return timestamp;

    }

    moveFeatures(base, offset, options) {
      var features = super.get('features'),
          stickyEnds = this.getStickyEnds(),
          stickyEndFormat = this.getStickyEndFormat(),
          featurePreviousState,
          storePreviousState,
          firstBase, lastBase,
          trigger = false,
          historyTimestamps = [];

      storePreviousState = function(feature) {
        featurePreviousState = featurePreviousState || _.deepClone(feature);
      };

      if (stickyEnds && stickyEndFormat){
        switch (stickyEndFormat){
          case "none":
            base += stickyEnds.start.size + stickyEnds.start.offset;
            break;
          case "overhang":
            base += stickyEnds.start.offset;
            break;
        }
      }

      if (_.isArray(features)) {

        for (var i = 0; i < features.length; i++) {
          var feature = features[i];
          featurePreviousState = undefined;

          for (var j = 0; j < feature.ranges.length; j++) {
            var range = feature.ranges[j];

            if (offset > 0) {

              if (range.from >= base) range.from += offset;
              if (range.to >= base) range.to += offset;
              if (range.from >= base || range.to >= base) trigger = true;

            } else {

              firstBase = base;
              lastBase = base - offset - 1;

              if (firstBase <= range.from) {
                storePreviousState(feature);
                trigger = true;
                if (lastBase >= range.to) {
                  feature.ranges.splice(j--, 1);
                } else {
                  range.from -= lastBase < range.from ? -offset : range.from - firstBase;
                  range.to += offset;
                }
              } else if (firstBase <= range.to) {
                storePreviousState(feature);
                trigger = true;
                range.to = Math.max(firstBase - 1, range.to + offset);
              }

            }
          }
          // If there are no more ranges, we remove the feature and
          // record the operation in the history
          if (feature.ranges.length === 0) {
            historyTimestamps.push(this.recordFeatureHistoryDel(featurePreviousState, true));
            features.splice(i--, 1);
          } else if (featurePreviousState !== undefined) {
            historyTimestamps.push(this.recordFeatureHistoryEdit(featurePreviousState, true));
          }
        }
        this.clearFeatureCache();
        if(trigger) this.trigger('change change:features');

      }

      return historyTimestamps;
    }

    clearFeatureCache() {
      this.nbFeaturesInRange.clearCache();
      this.maxOverlappingFeatures.clearCache();
    }

    /**
    @method getHistory
    @returns {HistorySteps} collection of {{#crossLink "HistoryStep"}}{{/crossLink}}
      attached to the model instance
    **/
    getHistory() {
      if (this.attributes.history.toJSON === undefined) {
        this.attributes.history = new HistorySteps(this.attributes.history);
      }
      return this.attributes.history;
    }

    /**
    Revert the last {{#crossLink "HistoryStep"}}{{/crossLink}} instance in
    {{#crossLink "Sequence/getHistory"}}{{/crossLink}} for which `hidden` is not
    `true`
    @method undo
    **/
    undo() {
      var history = this.getHistory(),
          lastStep = history.findWhere({hidden: false}),
          _this = this,
          linkedSteps, revertAndRemove;

      revertAndRemove = function(step) {
        _this.revertHistoryStep(step);
        history.remove(step);
      };

      if (lastStep) {
        linkedSteps = lastStep.get('linked') || [];
        revertAndRemove(lastStep);
        _.each(linkedSteps, function(timestamp) {
          revertAndRemove(history.findWhere({timestamp: timestamp}));
        });
      }
    }

    /**
    Reverts all {{#crossLink "HistoryStep"}}{{/crossLink}} instances after `timestamp`
    in {{#crossLink "Sequence/getHistory"}}Sequence#getHistory{{/crossLink}} for which `hidden` is not
    `true`
    @method undoAfter
    @param {integer} timestamp
    **/
    undoAfter(timestamp) {
      var _this = this,
          history = this.getHistory(),
          linkedSteps, revertAndPush,
          toBeDeleted = [];

      revertAndPush = function(step) {
        toBeDeleted.push(step);
        _this.revertHistoryStep.call(_this, step);
      };

      history.all(function(historyStep) {
        if (historyStep.get('timestamp') >= timestamp) {
          if(!historyStep.get('hidden')) {
            linkedSteps = historyStep.get('linked') || [];
            revertAndPush(historyStep);
            _.each(linkedSteps, function(timestamp) {
              revertAndPush(history.findWhere({timestamp: timestamp}));
            });
          }
          return true;

        } else {
          // the HistorySteps collection is sorted by DESC timestamp
          // so we can break out of the loop.
          return false;
        }
      });

      history.remove(toBeDeleted);
      this.throttledSave();

    }

    revertHistoryStep(historyStep) {
      var stickyEndFormatKey = 'stickyEndFormat';
      var previousStickyEndFormat = this.get(stickyEndFormatKey);
      var triggerWithPosition, position, value;

      this.set(stickyEndFormatKey, 'full', {silent: true});

      switch (historyStep.get('type')) {

        case 'featureIns':
          this.deleteFeature(historyStep.get('feature'), {updateHistory: false});
          break;

        case 'featureEdit':
          this.updateFeature(historyStep.get('featurePreviousState'), {updateHistory: false});
          break;

        case 'featureDel':
          this.createFeature(historyStep.get('featurePreviousState'), {updateHistory: false});
          break;

        case 'insert':
          position = historyStep.get('position');
          value = historyStep.get('value');
          triggerWithPosition = position;
          this.deleteBases(position, value.length, {updateHistory: false});
          break;

        case 'delete':
          position = historyStep.get('position');
          value = historyStep.get('value');
          triggerWithPosition = position + value.length;
          this.insertBases(
            historyStep.get('value'),
            historyStep.get('position'),
            {
              updateHistory: false
            }
          );
          break;
      }


      var offset = previousStickyEndFormat === 'overhang'  ? 
        this.getStickyEnds().start.offset : 
        0;

      var data = triggerWithPosition && {
        position: triggerWithPosition - offset
      };
      this.trigger('undo', data);

      this.set(stickyEndFormatKey, previousStickyEndFormat, {silent: true});
    }

    updateFeature(editedFeature, record) {
      var oldFeature = _.indexBy(this.getFeatures(), '_id')[editedFeature._id],
        id = this.getFeatures().indexOf(oldFeature);
      this.clearFeatureCache();
      this.set('features.' + id, editedFeature);
      this.sortFeatures();
      this.save();
      if (record === true) {
        this.recordFeatureHistoryEdit(editedFeature);
      }
      this.throttledSave();
    }

    createFeature(newFeature, options = {}) {
      var id = super.get('features').length, sortedIdList, len;

      if (options.updateHistory === true) {
        this.recordFeatureHistoryIns(newFeature);
      }
      // if (record === 'design-true')
      // this.getHistory().add({
      //   type: 'design-feature-create',
      //   feature: newFeature,
      //   name: newFeature.name,
      //   hidden: true,
      //   featureType: newFeature._type,
      //   range: [{
      //     from: newFeature.ranges[0].from,
      //     to: newFeature.ranges[0].to
      //   }]
      // }).get('timestamp');

      if (id === 0) {
        newFeature._id = 0;
      } else {
        sortedIdList = _.sortBy(_.pluck(this.get('features'),'_id'));
        len = sortedIdList.length;
        newFeature._id = sortedIdList[len-1]+1;
      }

      this.clearFeatureCache();
      this.set('features.' + id, newFeature);
      this.sortFeatures();
      this.throttledSave();
    }


    deleteFeature(feature, record) {
      var featureId;
      featureId = (feature._id===undefined)?feature.id : feature._id;
      this.clearFeatureCache();

      if (record === true) {
        this.recordFeatureHistoryDel(feature, false, false);
      }
      //  if (record === 'design-true')
      //  this.getHistory().add({
      //   type: 'design-feature-delete',
      //   feature: feature,
      //   hidden: true,
      //   name: feature.name,
      //   featureType: feature._type,
      //   range: [{
      //     from: feature.ranges[0].from,
      //     to: feature.ranges[0].to
      //   }]
      // }).get('timestamp');

      this.set('features', _.reject(super.get('features'), function(_feature) {
        return _feature._id == featureId;
      }));

      this.sortFeatures();
      this.throttledSave();
    }

    recordFeatureHistoryIns(feature) {
      return this.getHistory().add({
        type: 'featureIns',
        feature: feature,
        name: feature.name,
        featureType: feature._type,
        range: [{
          from: feature.ranges[0].from,
          to: feature.ranges[0].to
        }]
      }).get('timestamp');
    }

    recordFeatureHistoryDel() {
      var feature = arguments[0],
          isHidden = !!arguments[1];

      return this.getHistory().add({
        type: 'featureDel',
        name: feature.name,
        featurePreviousState: feature,
        featureType: feature._type,
        hidden: isHidden
      }).get('timestamp');
    }

    recordFeatureHistoryEdit() {
      var feature = arguments[0],
          isHidden = !!arguments[1];

      return this.getHistory().add({
        type: 'featureEdit',
        name: feature.name,
        featurePreviousState: feature,
        featureType: feature._type,
        hidden: isHidden
      }).get('timestamp');
    }

    sortFeatures() {
      this.set('features',
        _.sortBy(
          _.map(super.get('features'), function(feature) {
            feature.ranges = _.sortBy(feature.ranges, function(range) {
              return range.from;
            });
            return feature;
          }), function(feature) {
            return feature.ranges[0].from;
          }), {
          silent: true
        });
    }


    /**
     * Returns the positions of the first and last selectable ranges in
     * the sequence returned by {{#crossLink "Sequence/getSequence"}}getSequence{{/crossLink}} 
     * (i.e. account for sticky end format).
     *
     * If `reverse` is set to `true`, the range will refer to the complement of the
     *  sequence, *not the reverse complement* 
     *
     * @method  selectableRange
     * 
     * @param  {Boolean} reverse whether to return the selectable range on the
     *                           complement of the sequence
     *                           
     * @return {Array<Int>}      array of first and last base in the selectable range
     */
    selectableRange(reverse = false) {
      var stickyEndFormat = this.getStickyEndFormat();
      var stickyEnds = this.getStickyEnds();
      var length = this.getLength();

      if(stickyEnds && stickyEndFormat === 'overhang') {
        var getOffset = function(type) {
          return stickyEnds[type].reverse ? 
          (reverse ? 0 : stickyEnds[type].size) : 
          (reverse ? stickyEnds[type].size : 0);
        };

        return [
          getOffset('start'),
          length - getOffset('end') - 1
        ];
      } else {
        return [0, length - 1];
      }
    }

    /**
     * Returns the positions of the first and last editable ranges in
     * the sequence returned by {{#crossLink "Sequence/getSequence"}}getSequence{{/crossLink}}
     *  (i.e. account for sticky end format).
     *
     * Typically excludes sticky ends and overhangs
     * @method editableRange      
     * @return {Array<Int>} array of first and last base in the editable range
     */
    editableRange() {
      var stickyEndFormat = this.getStickyEndFormat();
      var stickyEnds = this.getStickyEnds();
      var length = this.getLength();

      if(stickyEnds && stickyEndFormat === 'overhang') {
        return [
          stickyEnds.start.size,
          length - stickyEnds.end.size - 1
        ];
      } else {
        return [0, length];
      }
    }

    length() {
      deprecated(this, 'length', 'getLength');
      return this.getLength();
    }

    getLength() {
      return this.getSequence().length;
    }

    throttledSave() {
      if(!this._throttledSave) {
        this._throttledSave = _.afterLastCall(_.bind(this.save, this), 300);
      }
      this._throttledSave();
    }

    ensureBaseIsSelectable(base, strict = false) {
      var selectableRange = this.selectableRange();
      return Math.min(
        Math.max(base, selectableRange[0]), 
        selectableRange[1] + (strict ? 0 : 1)
      );
    }

    ensureBaseIsEditable(base) {
      var editableRange = this.editableRange();
      return Math.min(Math.max(base, editableRange[0]), editableRange[1]+1);
    }

    isBaseEditable(base, strict = false) {
      var editableRange = this.editableRange();
      return editableRange[0] <= base && 
        editableRange[1] >= base - (strict ? 0 : 1);
    }

    isRangeEditable(start, end) {    
      if(end < start) {
        [end, start] = [start, end];
      }

      return this.isBaseEditable(start) &&  this.isBaseEditable(end, true);
    }

  }

  return classMethodsMixin(Sequence);
}