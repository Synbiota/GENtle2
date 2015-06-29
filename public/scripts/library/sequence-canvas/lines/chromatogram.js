import Line from './line';
import _ from 'underscore';


const colors = ['red', 'blue', 'green', 'purple']

export default class Chromatogram extends Line {
  constructor(sequenceCanvas, options = {}) {
    super(sequenceCanvas, options);
    // this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  }

  draw(x, y, [fromBase, toBase]) {
    const sequenceCanvas = this.sequenceCanvas;
    const artist = sequenceCanvas.artist;
    const layoutSettings = sequenceCanvas.layoutSettings;
    const layoutHelpers = sequenceCanvas.layoutHelpers;
    const pageMargins = layoutSettings.pageMargins;

    const sequence = this.sequence || sequenceCanvas.sequence;
    const rawData = sequence.get('chromatogramData');
    const maxDataValue = sequence.get('maxChromatogramValue') || 65536;

    const peaks = sequence.get('chromatogramPeaks');
    const height = this.height;

    // const normalizedWidth = layoutSettings.chromatographDims.width;
    const normalizedWidth = layoutSettings.basePairDims.width;

    // OPTIMIZATION: do this once on load
    /**
     * Slice the relevant data for a base from the provded raw data array.
     * A base is defined as the peaks[base] in the center, with half the data points
     * from the neighbouring bases on either side.
     *
     * For base 0, we start with data[0]. The right side is the same.
     * For base peaks.length, the left side is the same, and we end with data[data.length-1].
     *
     * @param  {Array}    data  Individual array of raw chromatograph data (one nucleotide only).
     * @param  {Integer}  base  Index of base.
     * @return {Array}          Raw data of range base-1 to base.
     */
    function getRelevantData(data, base){
      var start = base === 0 ?
                    0 :
                    peaks[base] - Math.floor((peaks[base] - peaks[base - 1])/2),

          end   = base === peaks.length ?
                    data.length :
                    peaks[base + 1] - Math.floor((peaks[base + 1] - peaks[base])/2);

      return data.slice(start, end);
    }

    /**
     * Arrange the raw data points into a set of x, y coordinates, evenly spaced into an
     * interval of normalizedWidth.
     *
     * @param  {Number} x         X Coordinate from where to assign data point.
     * @param  {Arrat}  rawData   Array of data points
     * @return {Array}            Array of [x,y] tuples that has a total width of normalizedWidth,
     *                            between the first and last point.
     */
    function normalize(x, rawData){
      var normalized = _.map(rawData, function(data, i){
        var xIncrement = normalizedWidth/rawData.length,
            xPos = x + (xIncrement * i),
            yPos = y + height * ( 1 - data / maxDataValue );

        return  [xPos, yPos];
      });

      return normalized;
    }

    /**
     * CURRENTLY UNUSED
     *
     * Previously used to clip the ends of the given sequence in order to prevent draw
     * overlap with existing segments on the canvas. Current implementation follows an array
     * slice input pattern and does not require this function.
     *
     * @param  {Array} points Array of [x,y] coordinates to be drawn.
     * @return {Array}        Clipped array.
     */
    function clip(points){

      var startDiff = fromBase === 0 ?
                        0 :
                        Math.floor(
                          (peaks[fromBase] - peaks[fromBase - 1]) / 2
                          ),
          endDiff   = toBase === peaks.length - 1 ?
                        0 :
                        Math.floor(
                          (peaks[toBase + 1] - peaks[toBase]) / 2
                          );

      return points.slice(startDiff, points.length - endDiff);
    }

    /**
     * Draw a line of specified by a set of [x,y] coordinates and line color.
     *
     * @param  {Array} points Array of [x,y] coordinates that form a path.
     * @param  {color} color  Color of line. Stroke style input.
     */
    function paint(points, color){
      artist.path(..._.flatten(points), {
        strokeStyle: color,
        lineWidth: 1
      });
    }

    /**
     * Main chromatogram draw function. Will iterate between the four nucleotides (A, C, G, T) and proceeds
     * to normalize and draw each data plot given the starting x position and the base range [toBase, FromBase].
     */
    function drawChromatogram(){

      _.forEach(['A','C','G','T'], function(nucleotide, i){

        var points = [],
            base = fromBase,
            numBases = toBase - fromBase;

        // Corner case for last peak, we want to include the information afterwards without resorting to
        // calling a toBase index that doesn't exist.
        if (toBase == peaks.length-1) numBases++;

        for (var j = 0; j <= numBases; j++){

          var data = getRelevantData(rawData[i], base + j),
              normalized = normalize(x + j * normalizedWidth, data);


          // I'm just keeping this here just so I have a place to put it for now. I'll remove this later.
          // artist.rect(normalized[0][0], 100, (normalized[normalized.length-1][0]-normalized[0][0]) , 50, {
          //   fillStyle: "#"+((1<<24)*Math.random()|0).toString(16)
          // })
          points = points.concat(normalized);
        }

        // Clip the ends to make sure the chromatogram stitches with the previously rendered
        // sequence. Do not clip ends if fromBase is 0 or toBase is peaks.length - 1.
        // points = clip(points);
        paint(points, colors[i]);
      });
    };

    drawChromatogram();

  }
}
