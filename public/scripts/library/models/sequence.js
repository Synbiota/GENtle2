import {assertion} from '../../common/lib/testing_utils';
import SequenceTransforms from '../../sequence/lib/sequence_transforms';
// TODO add dependency for underscore.mixin
import _ from 'underscore';
import sequenceClassMethodsMixin from './sequence_class_methods_mixin';


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
    });

    _.each(this.allFields(), (field) => {
      if(_.has(attributes, field)) {
        if(!_.isUndefined(this[field])) {
          throw `'${this.constructor.className}' (Sequence) Model already has the '${field}' attribute set.`;
        }
        this[field] = attributes[field];
        delete attributes[field];
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

  allFields() {
    return _.unique(this.requiredFields().concat(this.optionalFields()));
  }

  requiredFields() {
    return ['sequence'];
  }

  optionalFields() {
    return ['id', 'name', 'stickyEnds', 'features'];
  }

  /*
   @method _setupNestedClasses  Private method.  All the data preparation needed
                                for the instance to pass validation
   */
  _setupNestedClasses() {
  }

  validate() {
    _.each(this.requiredFields(), (field) => {
      assertion(_.has(this, field), `Field \`${field}\` is absent`);
    });
  }

  getBaseSequenceModel() {
    return this;
  }

  sortFeatures() {
    if(!this.features) return;
    var features = _.map(this.features, function(feature) {
      feature.ranges = _.sortBy(feature.ranges, 'from');
      return feature;
    });

    this.features = _.sortBy(features, (feature) => feature.ranges[0].from);
  }

  toJSON() {
    return _.reduce(this.allFields(), ((memo, field) => {
      memo[field] = this[field];
      return memo;
    }), {});
  }

  length() {
    return this.sequence.length;
  }

  duplicate() {
    var data = this.toJSON();
    delete data.id;
    return new this.constructor(data);
  }

  clearFeatureCache() {
    this.maxOverlappingFeatures.clearCache();
    this.nbFeaturesInRange.clearCache();
  }


  /**
  @method maxOverlappingFeatures
  @return {Integer}
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
  @return {Integer}
  **/
  nbFeaturesInRange(startBase, endBase) {
    return _.filter(this.features, function(feature) {
      return _.some(feature.ranges, function(range) {
        return range.from <= endBase && range.to >= startBase;
      });
    }).length;
  }


  //+stickyEnd methods
  isBeyondStickyEnd(pos, reverse = false) {
    return this.isBeyondStartStickyEnd(pos, reverse) || this.isBeyondEndStickyEnd(pos, reverse);
  }

  isBeyondStartStickyEndOnBothStrands(pos) {
    return this.overhangBeyondStartStickyEndOnBothStrands(pos) > 0;
  }

  isBeyondEndStickyEndOnBothStrands(pos) {
    return this.overhangBeyondEndStickyEndOnBothStrands(pos) > 0;
  }

  overhangBeyondStartStickyEndOnBothStrands(pos) {
    return Math.min(this.overhangBeyondStartStickyEnd(pos, true), this.overhangBeyondStartStickyEnd(pos, false));
  }

  overhangBeyondEndStickyEndOnBothStrands(pos) {
    return Math.min(this.overhangBeyondEndStickyEnd(pos, true), this.overhangBeyondEndStickyEnd(pos, false));
  }

  isBeyondStartStickyEnd(pos, reverse = false) {
    return this.overhangBeyondStartStickyEnd(pos, reverse) > 0;
  }

  isBeyondEndStickyEnd(pos, reverse = false) {
    return this.overhangBeyondEndStickyEnd(pos, reverse) > 0;
  }

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

  overhangBeyondEndStickyEnd(pos, reverse = false) {
    var stickyEnds = this.stickyEnds;
    var seqLength = this.length();
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

  getStickyEndSequence(getStartStickyEnd) {
    var wholeSequence = this.sequence;
    var stickyEnds = this.stickyEnds || {};
    var isOnReverseStrand;
    var sequence = '';
    var stickyEnd;

    if(getStartStickyEnd) {
      stickyEnd = stickyEnds.start;
      if(stickyEnd) {
        sequence = wholeSequence.substr(stickyEnd.offset, stickyEnd.size);
      }
    } else {
      stickyEnd = stickyEnds.end;
      if (stickyEnd) {
        var offset = wholeSequence.length - (stickyEnd.offset + stickyEnd.size);
        sequence = wholeSequence.substr(offset, stickyEnd.size);
      }
    }

    if(stickyEnd) {
      isOnReverseStrand = stickyEnd.reverse;
      if(isOnReverseStrand) {
        sequence = SequenceTransforms.toComplements(sequence);
      }
    }
    return {sequence, isOnReverseStrand};
  }

  getStartStickyEndSequence() {
    return this.getStickyEndSequence(true);
  }

  getEndStickyEndSequence() {
    return this.getStickyEndSequence(false);
  }

  stickyEndConnects(sequence) {
    var thisEndStickySequence = this.getEndStickyEndSequence();
    var otherStartStickySequence = sequence.getStartStickyEndSequence();

    var canConnect = ((thisEndStickySequence.isOnReverseStrand != otherStartStickySequence.isOnReverseStrand) &&
      SequenceTransforms.areComplementary(thisEndStickySequence.sequence, otherStartStickySequence.sequence));

    return canConnect;
  }

  hasStickyEnds() {
    var stickyEnds = this.stickyEnds;
    return !!(stickyEnds && stickyEnds.start && stickyEnds.end);
  }
  //-stickyEnd methods

  /**
  @method getSubSeq
  @param {Integer} startBase start of the subsequence (indexed from 0)
  @param {Integer} endBase end of the subsequence (indexed from 0)
  @return {String} the subsequence between the bases startBase and end Base
  **/
  getSubSeqWithoutStickyEnds(startBase, endBase) {
    if (endBase === undefined){
      endBase = startBase;
    } else {
      if (endBase >= this.length() && startBase >= this.length()) return '';
      endBase = Math.min(this.length() - 1, endBase);
    }
    startBase = Math.min(Math.max(0, startBase), this.length() - 1);
    return this.sequence.substr(startBase, endBase - startBase + 1);
  }

  getSubSeq(startBase, endBase, reverse = false) {
    return this.getSubSeqWithoutStickyEnds(startBase, endBase);
  }

  /*
  @method insertBases  Inserts a string of bases before a particular base
                       position in the sequence.
  @param  {String}  nucleotide bases to insert
  @param  {Integer}  base to insert bases before (0 indexed)
  @return {Undefined}
   */
  insertBases(bases, beforeBase) {
    this.sequence = (
      this.sequence.substr(0, beforeBase) +
      bases +
      this.sequence.substr(beforeBase, this.sequence.length - beforeBase + 1)
    );

    this.moveFeatures(beforeBase, bases.length);
  }

  /*
  @method deleteBases  Deletes K bases from base postion N
  @param  {Integer}  base N to start deleting from
  @param  {Integer}  delete K bases
  @return {Object}
          sequenceBasesRemoved: {String}  The sequence of bases deleted
          moveFeaturesResult:   {Object}  see method signature
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

  /*
  @method moveFeatures  Moves all features after position N, by K offset.
  @param  {Integer}  move features from position N (0 indexed)
  @param  {Integer}  move features by K offset, may be negative
  @return {Array<Object{state,feature}>}  array of objects with state of
                                          edited/deleted features and copy of
                                          feature before change
          state: {String}  one of [`edited`, `deleted`]
          feature: {Object}
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
  @method featuresInRange
  @param {integer} startBase
  @param {integer} endBase
  @return {array} all features present between start and end base
  **/
  featuresInRange(startBase, endBase) {
    if (_.isArray(this.features)) {
      return _(this.features).filter((feature) => {
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

}


BaseSequenceModel.className = 'BaseSequenceModel';


sequenceClassMethodsMixin(BaseSequenceModel);

export default BaseSequenceModel;
