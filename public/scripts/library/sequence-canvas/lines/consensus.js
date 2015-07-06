import Line from './line';
import _ from 'underscore';

export default class Consensus extends Line {

  constructor(sequenceCanvas, options) {
    super(sequenceCanvas, options);

    this.dims = _.defaults(options, {
      baseWidth: 10,
      yOffset: 95,
      consensusGoodHeight: 40,
      consensusMediumHeight: 30,
      consensusBadHeight: 20
    })
  }

  draw(x, y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        artist          = sequenceCanvas.artist,
        selection       = sequenceCanvas.selection,
        k, subSequence, character;


    // var baseWidth = Math.max(1, Math.round(this.canvasDims.widthsequence.getLength()));
    // var baseWidth = this.canvasDims.widthsequence.getLength();
    var baseWidth = ls.basePairDims.width || this.dims.baseWidth,
        yOffset = this.height || this.dims.yOffset,
        consensusGoodHeight = this.dims.consensusGoodHeight,
        consensusMediumHeight = this.dims.consensusMediumHeight,
        consensusBadHeight = this.dims.consensusBadHeight;

    function drawGood(index){
      artist.rect(
          x + (index * baseWidth),
          y + yOffset - consensusGoodHeight,
          baseWidth,
          consensusGoodHeight,
          {
            fillStyle: '#31A450'
          }
        );
    }

    function drawMedium(index){
      artist.rect(
          x + (index * baseWidth),
          y + yOffset - consensusMediumHeight,
          baseWidth,
          consensusMediumHeight,
          {
            fillStyle: '#F2EC00'
          }
        );
    }

    function drawBad(index){
      artist.rect(
          x + (index * baseWidth),
          y + yOffset - consensusBadHeight,
          baseWidth,
          consensusBadHeight,
          {
            fillStyle: '#EF000F'
          }
        );
    }

    _.forEach(sequence.getConsensus().slice(baseRange[0], baseRange[1]), function(consensus, i){

      if (consensus > 10){
        drawGood(i);
      } else if (consensus > 5) {
        drawMedium(i);
      } else {
        drawBad(i);
      }

    });

  }

}
