/**
 * @module gentle-models
 */
import {assertion} from '../../common/lib/testing_utils';
import SequenceTransforms from '../../sequence/lib/sequence_transforms';
// TODO add dependency for underscore.mixin
import _ from 'underscore';
import sequenceClassMethodsMixin from './sequence_class_methods_mixin';
import deprecated from '../common/deprecated';


/**
 * Represents a sequence of nucleotides (DNA bases).
 * @class  BaseSequenceModel
 * @constructor
 */
class BaseSequenceModel {
  constructor(attributes) {
    var id = _.uniqueId();
    _.defaults(attributes, {
      id: id,
      name: `Sequence ${id}`,
      // if true, it means it's an reverse sequence, complementary to the
      // sense strand
      reverse: false,
      readOnly: false,
      isCircular: false,
      features: [],
    });

    _.each(this.allFields(), (field) => {
      if(_.has(attributes, field)) {
        if(!_.isUndefined(this[field])) {
          throw `'${this.constructor.name}' (Sequence) Model already has the '${field}' attribute set.`;
        }
        this[field] = attributes[field];
        // delete attributes[field];
      }
    });
    this.sortFeatures();

    // Run any setup required before validation
    this._setupNestedClasses();

    // Data validation
    this.validate();

    this.maxOverlappingFeatures = _.memoize2(this.maxOverlappingFeatures);
    this.nbFeaturesInRange = _.memoize2(this.nbFeaturesInRange);
  }

  /**
   * Return a list of all possible attribute fields on this model.
   * @method allFields
   * @return {Array<String>}
   */
  allFields() {
    return _.unique(this.requiredFields().concat(this.optionalFields()));
  }

  /**
   * Return a list of all required attribute fields on this model.
   * @method requiredFields
   * @return {Array<String>}
   */
  requiredFields() {
    return ['sequence'];
  }

  /**
   * Return a list of all optional attribute fields on this model.
   * @method optionalFields
   * @return {Array<String>}
   */
  optionalFields() {
    return [
      'id',
      'name',
      'stickyEnds',
      'features',
      'reverse',
      'readOnly',
      'isCircular',
    ];
  }

  /**
   * Private method.  All the data preparation needed for the instance to pass
   * validation.
   *
   * @private
   * @method _setupNestedClasses
   * @return {undefined}
   */
  _setupNestedClasses() {
  }

  /**
   * @method validate
   * @return {undefined}
   * @throws {Error}  If any validation fails,
   */
  validate() {
    _.each(this.requiredFields(), (field) => {
      assertion(_.has(this, field), `Field \`${field}\` is absent`);
    });
  }

  /**
   * @method getBaseSequenceModel
   * @return {SequenceModel}  This SequenceModel instance.
   */
  getBaseSequenceModel() {
    return this;
  }

  /**
   * @method sortFeatures
   * @return {undefined}
   */
  sortFeatures() {
    if(!this.features) return;
    var features = _.map(this.features, function(feature) {
      feature.ranges = _.sortBy(feature.ranges, 'from');
      return feature;
    });

    this.features = _.sortBy(features, (feature) => feature.ranges[0].from);
  }

  /**
   * @method toJSON
   * @return {Object} Attributes of this sequenceModel,
   */
  toJSON() {
    return _.reduce(this.allFields(), ((memo, field) => {
      memo[field] = this[field];
      return memo;
    }), {});
  }

  /**
   * Length of this SequenceModel sequenceBases.
   * @method length
   * @deprecated
   * @return {Integer}
   */
  length() {
    deprecated(this, 'length', 'getLength');
    return this.getLength();
  }

  /**
   * Length of this SequenceModel sequenceBases.
   * @method getLength
   * @return {Integer}
   */
  getLength() {
    return this.sequence.length;
  }

  /**
   * @method duplicate
   * @return {SequenceModel} Copy of this SequenceModel.
   */
  duplicate() {
    var data = this.toJSON();
    delete data.id;
    return new this.constructor(data);
  }

  /**
   * @method clearFeatureCache
   * @return {undefined}
   */
  clearFeatureCache() {
    this.maxOverlappingFeatures.clearCache();
    this.nbFeaturesInRange.clearCache();
  }

  //+stickyEnd methods
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
  isBeyondStartStickyEnd(pos, reverse = false) {
    return this.overhangBeyondStartStickyEnd(pos, reverse) > 0;
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
    var stickyEnds = this.stickyEnds;
    var result = 0;

    if(stickyEnds) {
      var startStickyEnd = stickyEnds.start;

      if(startStickyEnd) {
        if(reverse) {
          if(startStickyEnd.reverse) {
            result = startStickyEnd.offset - pos;
          } else {
            result = (startStickyEnd.offset + startStickyEnd.size) - pos;
          }
        } else {
          if(startStickyEnd.reverse) {
            result = (startStickyEnd.offset + startStickyEnd.size) - pos;
          } else {
            result = startStickyEnd.offset - pos;
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
    var stickyEnds = this.stickyEnds;
    var seqLength = this.getLength();
    var result = 0;

    if(stickyEnds) {
      var endStickyEnd = stickyEnds.end;

      if(endStickyEnd) {
        var stickyEndTo = seqLength - 1 - endStickyEnd.offset;
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
    var wholeSequenceBases = this.sequence;
    var stickyEnds = this.stickyEnds || {};
    var isOnReverseStrand;
    var sequenceBases = '';
    var stickyEnd;

    if(getStartStickyEnd) {
      stickyEnd = stickyEnds.start;
      if(stickyEnd) {
        sequenceBases = wholeSequenceBases.substr(stickyEnd.offset, stickyEnd.size);
      }
    } else {
      stickyEnd = stickyEnds.end;
      if (stickyEnd) {
        var offset = wholeSequenceBases.length - (stickyEnd.offset + stickyEnd.size);
        sequenceBases = wholeSequenceBases.substr(offset, stickyEnd.size);
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
  stickyEndConnects(sequenceModel) {
    var thisEndStickySequence = this.getEndStickyEndSequence();
    var otherStartStickySequence = sequenceModel.getStartStickyEndSequence();

    var canConnect = ((thisEndStickySequence.isOnReverseStrand != otherStartStickySequence.isOnReverseStrand) &&
      SequenceTransforms.areComplementary(thisEndStickySequence.sequenceBases, otherStartStickySequence.sequenceBases));

    return canConnect;
  }

  /**
   * @method hasStickyEnds
   * @return {Boolean}
   */
  hasStickyEnds() {
    var stickyEnds = this.stickyEnds;
    return !!(stickyEnds && stickyEnds.start && stickyEnds.end);
  }
  //-stickyEnd methods

  /**
   * @method getSubSeqWithoutStickyEnds
   * @param {Integer} startBase Start of the subsequence (indexed from 0)
   * @param {Integer} endBase   End of the subsequence (indexed from 0)
   * @return {String} the subsequence between the bases startBase and end Base
   */
  getSubSeqWithoutStickyEnds(startBase, endBase) {
    if(endBase === undefined) {
      endBase = startBase;
    } else {
      if(endBase >= this.getLength() && startBase >= this.getLength()) return '';
      endBase = Math.min(this.getLength() - 1, endBase);
    }
    startBase = Math.min(Math.max(0, startBase), this.getLength() - 1);
    return this.sequence.substr(startBase, endBase - startBase + 1);
  }

  /**
   * Returns part of sequence bases.
   * @method getSubSeq
   * @param  {Integer}  startBase
   * @param  {Integer}  endBase
   * @return {String}  Sequence bases.
   */
  getSubSeq(startBase, endBase) {
    return this.getSubSeqWithoutStickyEnds(startBase, endBase);
  }

  /**
   * Returns a subsequence including the sequence between the bases `startBase`
   * and `endBase`.
   * Ensures that the subsequence:
   *   * contains whole blocks of size `padding` (i.e. its length is divisible
   *     by size `padding` with no remainder).
   *   * starting from the base `offset` in the complete sequence are not broken
   *     by the beginning or the end of the subsequence (TODO improve this comment).
   * @method getPaddedSubSeq
   * @param {Integer} startBase Start of the subsequence (indexed from 0)
   * @param {Integer} endBase   End of the subsequence (indexed from 0)
   * @param {Integer} padding
   * @param {Integer} offset=0  Relative to the start of full sequence
   * @return {Object}
   *         {String} subSeq String of the subsequence.
   *         {Integer} startBase The actual start of the subsequence returned.
   *         {Integer} endBase   The actual end of the subsequence returned.
   */
  getPaddedSubSeq(startBase, endBase, padding, offset = 0) {
    startBase = Math.max(startBase - ((startBase - offset) % padding), 0);
    endBase = Math.min(endBase - ((endBase - offset) % padding) + padding - 1, this.getLength());
    var subSeq = this.getSubSeq(startBase, endBase);
    return {subSeq, startBase, endBase};
  }

  /**
   * Returns a transformed subsequence between the bases `startBase` and `endBase`
   * @method getTransformedSubSeq
   * @param {String} variation Name of the transformation.  Available
   *                           transformations: [`aa-long`, `aa-short`, `complements`]
   * @param {Object} options
   *   @param {Integer} options.offset  TODO: explain when and how this is used.
   *   @param {Boolean} options.complements
   * @param {Integer} startBase start of the subsequence (indexed from 0)
   * @param {Integer} endBase end of the subsequence (indexed from 0)
   * @return {String}
   */
  getTransformedSubSeq(variation, options, startBase, endBase) {
    options = options || {};
    var output = '';
    switch (variation) {
      case 'aa-long':
      case 'aa-short':
        var paddedSubSeq = this.getPaddedSubSeq(startBase, endBase, 3, options.offset || 0);
        output = _.map(paddedSubSeq.subSeq.match(/.{1,3}/g) || [], function(codon) {
          if (options.complements === true) codon = SequenceTransforms.toComplements(codon);
          return SequenceTransforms[variation === 'aa-long' ? 'codonToAALong' : 'codonToAAShort'](codon);
        }).join('');
        var offset = Math.max(0, paddedSubSeq.startBase - startBase);
        output = output.substr(Math.max(0, startBase - paddedSubSeq.startBase), endBase - startBase + 1 - offset);
        _.times(Math.max(0, offset), function() {
          output = ' ' + output;
        });
        break;
      case 'complements':
        output = SequenceTransforms.toComplements(this.getSubSeq(startBase, endBase, true));
        break;
      default:
        throw new Error(`Unsupported sequence transform '${variation}'`);
    }
    return output;
  }

  /**
   * Codon to which the base belongs and position of the base in the codon.
   * @method getCodon
   * @param {Integer} base Indexed from 0.
   * @param {Integer} offset=0
   * @return {Object}
   *         sequence: {String}
   *         position: {Integer}
   */
  getCodon(base, offset = 0) {
    if(base < 0) throw new Error(`'base' must be >= 0 but was '${base}'`);
    var subSeq = this.getPaddedSubSeq(base, base, 3, offset);
    if (subSeq.startBase > base) {
      return {
        sequence: this.sequence[base],
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
   * Returns the amino acid for a given based
   * @method getAA
   * @param {String} variation Name of the transformation.  Available
   *                           transformations: [`short`, `long`]
   * @param  {Integer} base
   * @param  {Integer} offset=0
   * @return {Object}
   *         sequence: {String}  The amino acid (TODO: rename this key from
   *                             `sequence` to `aminoAcid`)
   *         position: {Integer}
   */
  getAA(variation, base, offset = 0) {
    var codon = this.getCodon(base, offset);
    var transform = variation === 'short' ? 'codonToAAShort' : 'codonToAALong';
    var aa = SequenceTransforms[transform](codon.sequence) || '   ';
    return {
      sequence: aa,
      position: codon.position
    };
  }

  /**
   * Inserts a string of bases before a particular base position in the
   * sequence.
   * @method insertBases
   * @param  {String} bases  Nucleotide bases to insert.
   * @param  {Integer} beforeBase  Base to insert bases before (0 indexed).
   * @return {Undefined}
   */
  insertBases(bases, beforeBase) {
    this.sequence = (
      this.sequence.substr(0, beforeBase) +
      bases +
      this.sequence.substr(beforeBase, this.sequence.length - beforeBase + 1)
    );

    this.moveFeatures(beforeBase, bases.length);
  }

  /**
   * Deletes K bases from base postion N.
   * @method deleteBases
   * @param  {Integer} firstBase Base N to start deleting from.
   * @param  {Integer} length    Delete K bases.
   * @return {Object}
   *         sequenceBasesRemoved: {String}  The sequence of bases deleted
   *         moveFeaturesResult:   {Object}  see method signature
   */
  deleteBases(firstBase, length) {
    var sequenceBasesRemoved = this.sequence.substr(firstBase, length);

    this.sequence = (
      this.sequence.substr(0, firstBase) +
      this.sequence.substr(firstBase + length, this.sequence.length - (firstBase + length - 1))
    );

    var moveFeaturesResult = this.moveFeatures(firstBase, -length);
    return {sequenceBasesRemoved, moveFeaturesResult};
  }

  /**
   * Moves all features after position N, by K offset.
   * @method moveFeatures
   * @param  {Integer} base   Move features from position N (0 indexed).
   * @param  {Integer} offset Move features by K offset, may be negative.
   * @return {Array}  Array of objects `<Object{state,feature}>`
   *      state: {String}  One of [`edited`, `deleted`]
   *      feature: {Object}  Copy of feature before change
   */
  moveFeatures(base, offset) {
    var features = this.features,
        featurePreviousState,
        firstBase, lastBase,
        previousFeatureState,
        previousFeatureStates = [];

    var storePreviousFeatureState = function(feature) {
      previousFeatureState = previousFeatureState || _.deepClone(feature);
    };

    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      featurePreviousState = undefined;

      for (var j = 0; j < feature.ranges.length; j++) {
        var range = feature.ranges[j];

        if (offset > 0) {
          if (range.from >= base || range.to >= base) storePreviousFeatureState(feature);
          if (range.from >= base) range.from += offset;
          if (range.to >= base) range.to += offset;

        } else {

          firstBase = base;
          lastBase = base - offset - 1;

          if (firstBase <= range.from) {
            storePreviousFeatureState(feature);
            if (lastBase >= range.to) {
              feature.ranges.splice(j--, 1);
            } else {
              range.from -= lastBase < range.from ? -offset : range.from - firstBase;
              range.to += offset;
            }
          } else if (firstBase <= range.to) {
            storePreviousFeatureState(feature);
            range.to = Math.max(firstBase - 1, range.to + offset);
          }

        }
      }
      if (feature.ranges.length === 0) {
        // If there are no more ranges we remove the feature
        features.splice(i--, 1);
        previousFeatureStates.push({'state': 'deleted', 'feature': previousFeatureState});
      } else if (!_.isUndefined(previousFeatureState)) {
        previousFeatureStates.push({'state': 'edited', 'feature': previousFeatureState});
      }
    }
    this.clearFeatureCache();
    return {previousFeatureStates};
  }

  /**
   * @method deleteFeature
   * @param  {Object} feature
   * @return {undefined}
   */
  deleteFeature(feature) {
    this.clearFeatureCache();
    // TODO refactor feature so we only have one id key
    var getId = function(feature) {
      return (feature._id === undefined) ? feature.id : feature._id;
    };
    var featureId = getId(feature);
    this.features = _.reject(this.features, (_feature) => getId(_feature) === featureId);
    this.sortFeatures();
  }

  /**
   * Includes partially overlapping feature range(s)
   * @method filterRanges
   * @param  {Integer} startBase
   * @param  {Integer} endBase
   * @param  {Array} ranges List of feature ranges
   * @return {Array} All ranges overlapping start and end base.
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
   * @method maxOverlappingFeatures
   * @return {Integer}
   */
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
   * Features with at least one range partially in the range given.
   * @method featuresInRange
   * @param {Integer} startBase
   * @param {Integer} endBase
   * @return {Array} Features
   */
  featuresInRange(startBase, endBase) {
    return _(this.features).filter((feature) => {
      return this.filterRanges(startBase, endBase, feature.ranges).length > 0;
    });
  }

  /**
   * Number of features with at least one range partially in the range given.
   * @method  nbFeaturesInRange
   * @param  {Integer} startBase
   * @param  {Integer} endBase
   * @return {Integer}
   */
  nbFeaturesInRange(startBase, endBase) {
    return this.featuresInRange(startBase, endBase).length;
  }

}


sequenceClassMethodsMixin(BaseSequenceModel);

export default BaseSequenceModel;
