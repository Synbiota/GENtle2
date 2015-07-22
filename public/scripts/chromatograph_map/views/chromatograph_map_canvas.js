import {handleError} from '../../common/lib/handle_error';
import Q from 'q';
import Artist from '../../common/lib/graphics/artist';
import _ from 'underscore';
// import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';
import Styles from '../../styles.json';

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
      }
    };

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
    var artist = this.artist;
    var fullConsensus = this.model.getConsensus();
    var _this = this;

    var head = {
      type: getType(fullConsensus[0]),
      position: 0
    };

    // var baseWidth = Math.max(1, Math.round(this.canvasDims.width/this.model.getLength()));
    var baseWidth = this.canvasDims.width/this.model.getLength();


    function drawRect(start, end, type){

      var setting = _this.consensusSettings[type];

      artist.rect(
          start * baseWidth,
          _this.tempDims.yOffset - setting.height,
          (end - start) * baseWidth,
          setting.height,
          {
            fillStyle: setting.color
          }
        );
    }

    function getType(consensus){
      var type;

      if (consensus > 10){
        type = 'good';
      } else if (consensus > 5) {
        type = 'medium';
      } else {
        type = 'bad';
      }

      return type;
    }



    _.forEach(fullConsensus, function(consensus, i){

      if (head.type != getType(consensus) || (i == fullConsensus.length - 1)){
        drawRect(head.position, i, head.type);
        head = {
          type: getType(consensus),
          position: i
        };
      }

    });

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
