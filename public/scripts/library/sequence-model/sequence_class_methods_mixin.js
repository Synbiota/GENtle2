// TODO add dependency to _.deepClone
import _ from 'underscore';


var calculateOverhang = function(sequenceModel, pos) {
  var overhangStart = sequenceModel.minOverhangBeyondStartStickyEndOnBothStrands(pos);
  var overhangEnd = sequenceModel.minOverhangBeyondEndStickyEndOnBothStrands(pos);
  return Math.max(overhangStart, 0) - Math.max(overhangEnd, 0);
};


var concatenateSequences = function(sequenceModels, circularise=false, truncateFeatures=true) {
  var previousSequenceModel;
  var previousStickyEnds;
  var previousStickyEndFormats = {};

  var newSequenceAttributes = _.reduce(sequenceModels, function(attributes, sequenceModel, i) {
    var isFirst = i === 0;
    var isLast = i === (sequenceModels.length - 1);

    // Enforcing full sticky end format on all sequence models
    previousStickyEndFormats[sequenceModel.get('id')] = sequenceModel.getStickyEndFormat();
    sequenceModel.setStickyEndFormat('full');

    var stickyEnds = sequenceModel.getStickyEnds(false) || {};
    var appendSequenceBases = sequenceModel.getSequence();

    // Add sticky ends
    if(isFirst) {
      if(stickyEnds.start) {
        // Add sticky end at start
        attributes.stickyEnds.start = stickyEnds.start;
      }
    }
    if(isLast) {
      if(stickyEnds.end) {
        // Add sticky end at end
        attributes.stickyEnds.end = stickyEnds.end;
      }
    }

    var offset = 0;
    if(isFirst && circularise) {
      previousSequenceModel = sequenceModels[sequenceModels.length-1];
      previousStickyEnds = previousSequenceModel.getStickyEnds(true);
    }
    if(previousSequenceModel) {
      // Check sticky ends are compatible
      if(previousSequenceModel.stickyEndConnects(sequenceModel)) {
        attributes.sequence = attributes.sequence.substr(0, attributes.sequence.length - previousStickyEnds.end.offset);
        var toRemove = stickyEnds.start.offset + stickyEnds.start.size;
        appendSequenceBases = appendSequenceBases.substr(toRemove);
        offset = attributes.sequence.length - toRemove;
      } else {
        throw `Can not concatenate sequences ${previousSequenceModel.id} and ${sequenceModel.id} as they have incompatible sticky ends: \`${previousSequenceModel.getEndStickyEndSequence().sequenceBases}\` and \`${sequenceModel.getStartStickyEndSequence().sequenceBases}\``;
      }
    }
    if(isLast && circularise) {
      appendSequenceBases = appendSequenceBases.substr(0, appendSequenceBases.length - stickyEnds.end.offset);
    }
    // Add the suitable sequence bases
    attributes.sequence += appendSequenceBases;

    // Add features
    _.each(sequenceModel.getFeatures(), (feature) => {
      var positions = _.flatten(_.map(feature.ranges, (range) => [range.to, range.from]));
      var maxPos = Math.max(...positions);
      var minPos = Math.min(...positions);
      var accepted = true;
      var overhangStart = sequenceModel.minOverhangBeyondStartStickyEndOnBothStrands(minPos);
      var overhangEnd = sequenceModel.minOverhangBeyondEndStickyEndOnBothStrands(maxPos);
      if((circularise || !isFirst) && (overhangStart > 0)) {
        accepted = false;
      }
      if((circularise || !isLast) && (overhangEnd > 0)) {
        accepted = false;
      }
      if(accepted || truncateFeatures) {
        var copiedFeature = _.deepClone(feature);

        _.each(copiedFeature.ranges, (range) => {
          // TODO improve.  Is partial truncate implementation.  If there is a
          // range completely outside the sequence, it will be truncate to be
          // 1 long at the start / end of the sequence, which is a) stupid and
          // b) might overlap with another truncated range.  The range should
          // just be dropped completely.
          var overhangOnFrom = calculateOverhang(sequenceModel, range.from);
          var overhangOnTo = calculateOverhang(sequenceModel, range.to);
          range.from += offset;
          range.to += offset;
          if(truncateFeatures) {
            range.from += overhangOnFrom;
            range.to += overhangOnTo;
          }
        });

        attributes.features.push(copiedFeature);
      }
    });

    previousSequenceModel = sequenceModel;
    previousStickyEnds = stickyEnds;
    return attributes;
  }, {
    sequence: '',
    stickyEnds: {},
    features: [],
  });
  

  // Resetting sticky end formats to their initial values
  _.each(sequenceModels, function(sequenceModel) {
    var previousFormat = previousStickyEndFormats[sequenceModel.get('id')];
    sequenceModel.setStickyEndFormat(previousFormat);
  });

  return new this(newSequenceAttributes);
};


var sequenceClassMethodsMixin = function(Klass) {
  var classMethods = {
    calculateOverhang,
    concatenateSequences,
  };
  _.each(classMethods, function(methodFunction, methodName) {
    Klass[methodName] = _.bind(methodFunction, Klass);
  });

  return Klass;
};


export default sequenceClassMethodsMixin;
