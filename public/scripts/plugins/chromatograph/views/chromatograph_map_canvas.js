import Q from 'q';
import {handleError} from '../../../common/lib/handle_error';
import Artist from '../../../common/lib/graphics/artist';
import _ from 'underscore';
// import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';
import Styles from '../../../styles.json';
import ConsensusLine from '../../../library/sequence-canvas/lines/consensus'

var LineStyles = Styles.sequences.lines;

export default class ChromatographMapCanvas {
  constructor(options) {

    // this.mouseTool = {};
    // this.mouseTool.drag = false;

    this.view = options.view;
    this.$el = options.view.$el;
    this.model = options.view.model;
    this.$canvas = options.$canvas;
    this.artist = new Artist(options.$canvas);

    this.sequence = this.model;

    this.tempDims = {
      yOffset: 100,
    };

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
      },

      'none': {
        height: 0,
        color: '#FFF'
      }
    };

    this.consensusLine = new ConsensusLine(this, {
      height: 10,
    });

    _.bindAll(this, 'render', 'refresh', 'handleClick');
    this.refresh();

    this.model.on('change', _.debounce(this.render, 500));

    this.view.parentView().on('resize', _.debounce(this.refresh, 200));
    this.$canvas.on('click', this.handleClick);

  }

  render() {

    this.clear();

    this.drawConsensus();
  }

  refresh() {
    this.setupCanvas()
      .then(this.render)
      .catch(handleError);
  }

  setupCanvas() {
    var _this = this,
        artist = _this.artist;

    return Q.promise(function(resolve) {
      // Updates width of $canvas to take scrollbar of $scrollingParent into account
      // _this.$canvas.width(_this.$el.width());
      _this.$canvas.width('100%');

      var width = _this.$canvas[0].scrollWidth,
          height = _this.$canvas[0].scrollHeight;

      _this.canvasDims = {
        width: width,
        height: height,
      };


      artist.setDimensions(width, height);

      resolve();
    });
  }

  drawConsensus() {

    // var baseWidth = Math.max(1, Math.round(this.canvasDims.width/this.model.getLength()));
    var baseWidth = this.canvasDims.width/this.model.getLength();

    this.consensusLine.draw(0, 90, [0, this.model.getLength()-1], baseWidth);

  }

  clear() {

    this.artist.clear()


  }

  handleClick(event) {

    // this.view.parentView().sequenceCanvas.scrollToBase(
    //   Math.floor(this.model.getLength() * angle / Math.PI / 2)
    // );
  }
}
