import Line from './line';
import _ from 'underscore';

export default class Consensus extends Line {

  constructor(sequenceCanvas, options) {
    super(sequenceCanvas, options);

    this.dims = _.defaults(options, {
      baseWidth: 10,
      yOffset: 95,
    })

    this.consensusSettings = {
      'good': {
        height: 40,
        color: '#31A450',
      },

      'medium': {
        height: 30,
        color: '#F2EC00',
      },

      'bad': {
        height: 20,
        color: '#EF000F',
      }
    }


  }

  draw(x, y, baseRange) {
    var sequenceCanvas  = this.sequenceCanvas,
        ls              = sequenceCanvas.layoutSettings,
        lh              = sequenceCanvas.layoutHelpers,
        sequence        = sequenceCanvas.sequence,
        artist          = sequenceCanvas.artist,
        selection       = sequenceCanvas.selection,
        fragments       = sequence.get('chromatogramFragments'),
        k, subSequence, character;

    var _this = this,
        baseWidth = ls.basePairDims.width || this.dims.baseWidth,
        yOffset = this.height || this.dims.yOffset;

        // consensus = sequence.getConsensus().slice(baseRange[0], baseRange[1] + 1),
        // head = {
        //   type: getType(consensus[0]),
        //   position: 0
        // };


    // function drawRect(start, end, type){
    //   var setting = _this.consensusSettings[type]

    //   // if (end && (end == consensus.length - 1)) debugger

    //   artist.rect(
    //       x + (start * baseWidth),
    //       y + yOffset - setting.height,
    //       (end - start) * baseWidth,
    //       setting.height,
    //       {
    //         fillStyle: setting.color
    //       }
    //     );
    // }

    function drawRect(start, type){
      var setting = _this.consensusSettings[type]

      artist.rect(
          x + (start * baseWidth),
          y + yOffset - setting.height,
          baseWidth,
          setting.height,
          {
            fillStyle: setting.color
          }
        );
    }

    _.forEach(fragments.getConsensus().slice(baseRange[0], baseRange[1] + 1), function(base, i){

        if (_.contains(['A', 'C', 'G', 'T'], base)){
          drawRect(i, 'good')
        } else if (_.contains(['N'], base)){
          drawRect(i, 'medium')
        } else {
          drawRect(i, 'bad')
        }

    });

  }

}
