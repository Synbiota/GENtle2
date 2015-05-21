export default {
  concatenateSequences(sequenceModels, circularise=false, truncateFeatures=true) {
    var previousSequenceModel;
    var previousStickyEnds;

    var newSequenceAttributes = _.reduce(sequenceModels, function(attributes, sequenceModel, i) {
      var isFirst = i === 0;
      var isLast = i === (sequenceModels.length - 1);
      var stickyEnds = sequenceModel.get('stickyEnds');
      var appendSequenceNts = sequenceModel.get('sequence');


      // Add sticky ends
      if(isFirst && !circularise) {
        if(stickyEnds.start) {
          // Add sticky end at start
          attributes.stickyEnds.start = _.deepClone(stickyEnds.start);
        }
      }
      if(isLast && !circularise) {
        if(stickyEnds.end) {
          // Add sticky end at end
          attributes.stickyEnds.end = _.deepClone(stickyEnds.end);
        }
      }

      var offset = 0;
      if(isFirst && circularise) {
        previousSequenceModel = sequenceModels[sequenceModels.length-1];
        previousStickyEnds = previousSequenceModel.get('stickyEnds');
      }
      if(previousSequenceModel) {
        // Check sticky ends are compatible
        if(previousSequenceModel.stickyEndConnects(sequenceModel)) {
          attributes.sequence = attributes.sequence.substr(0, attributes.sequence.length - previousStickyEnds.end.offset);
          var toRemove = stickyEnds.start.offset + stickyEnds.start.size;
          appendSequenceNts = appendSequenceNts.substr(toRemove);
          offset = attributes.sequence.length - toRemove;
        } else {
          throw `Can not concatenate sequences ${previousSequenceModel.get('id')} and ${sequenceModel.get('id')} as they have incompatible sticky ends: \`${previousSequenceModel.getEndStickyEndSequence().sequence}\` and \`${sequenceModel.getStartStickyEndSequence().sequence}\``;
        }
      }
      if(isLast && circularise) {
        appendSequenceNts = appendSequenceNts.substr(0, appendSequenceNts.length - stickyEnds.end.offset);
      }
      // Add the suitable sequence bases
      attributes.sequence += appendSequenceNts;

      // Add features
      _.each(sequenceModel.getFeatures(), (feature) => {
        var positions = _.flatten(_.map(feature.ranges, (range) => [range.to, range.from]));
        var maxPos = Math.max(...positions);
        var minPos = Math.min(...positions);
        var accepted = true;
        var overhangStart = sequenceModel.overhangBeyondStartStickyEndOnBothStrands(minPos);
        var overhangEnd = sequenceModel.overhangBeyondEndStickyEndOnBothStrands(maxPos);
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
            // range completely outside the seqeunce, it will be truncate to be
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
    return new SequenceModel(newSequenceAttributes);
  },


  calculateProduct(sequenceNts, opts) {
    if(_.isUndefined(opts.from) || _.isUndefined(opts.to)) {
      throw "Must specify `opts.from` and `opts.to`";
    }
    var regionOfInterest = sequenceNts.slice(opts.from, opts.to + 1);
    var startStickyEnd = opts.stickyEnds && opts.stickyEnds.start || '';
    var endStickyEnd = opts.stickyEnds && opts.stickyEnds.end || '';

    if(!_.isString(startStickyEnd)) startStickyEnd = startStickyEnd.sequence;
    if(!_.isString(endStickyEnd)) endStickyEnd = endStickyEnd.sequence;

    var productSequence = startStickyEnd + regionOfInterest + endStickyEnd;
    return {productSequence, regionOfInterest, startStickyEnd, endStickyEnd};
  }
};