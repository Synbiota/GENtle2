import Line from './line';
import _ from 'underscore';


const colors = ['red', 'blue', 'green', 'purple']

export default class Chromatogram extends Line {
  constructor(sequenceCanvas, options = {}) {
    super();
    this.sequenceCanvas = sequenceCanvas;
    _.extend(this, options);
  }

  draw(x, y, [fromBase, toBase]) {
    const sequenceCanvas = this.sequenceCanvas;
    const artist = sequenceCanvas.artist;
    const layoutSettings = sequenceCanvas.layoutSettings;
    const layoutHelpers = sequenceCanvas.layoutHelpers;
    const pageMargins = layoutSettings.pageMargins;

    // Legacy const for vertical canvas. Keeping around just in case.
    // const blocksPerRow = layoutHelpers.basesPerRow / layoutSettings.basesPerBlock;
    // const effectiveWidth = blocksPerRow * layoutSettings.basesPerBlock *
    //   layoutSettings.basePairDims.width +
    //   (blocksPerRow - 1) * layoutSettings.gutterWidth;

    const sequence = sequenceCanvas.sequence;
    const rawData = sequence.get('chromatogramData');
    const maxDataValue = sequence.get('maxChromatogramValue') || 65536;

    const peaks = sequence.get('chromatogramPeaks');
    const height = this.height;


    // Old non-uniform width base pair implementation. Distance between nucleotides was dependent on the number of
    // const dataRelevantLength = rawData[0].length + 0*(peaks[peaks.length - 1] + 14);
    // const dataRelevantLength = rawData[0].length;
    // const dataRelevantOffset = 0 + 0*(rawData[0].length - peaks[peaks.length-1]);

    // const dataDensity = Math.floor( dataRelevantLength / sequence.getLength());

    // const xInterval =  effectiveWidth / (toBase - fromBase + 1) / dataDensity;
    // const xInterval =  1;
    // data points between peaks.
    // const relevantRawData = _.map(rawData, function(data) {
    //   // return data.slice(dataRelevantOffset + fromBase * dataDensity, dataRelevantOffset + toBase * dataDensity);
    //   // return data.slice(dataDensity * fromBase, dataDensity * (toBase+1));

    //   var start = fromBase === 0 ?
    //                 0 :
    //                 peaks[fromBase - 1],

    //       end   = toBase === peaks.length-1 ?
    //                 data.length - 1 :
    //                 peaks[toBase + 1];

    //       if (start > 0) start += layoutSettings.basePairDims.width/2;
    //       if (end < peaks.length -1 ) end -= layoutSettings.basePairDims.width/2;

    //   return data.slice(start, end+1);
    // });

    // var allPoints = _.map(relevantRawData, function(rawData_, i) {

    //   return _.map(rawData_, function(data, i) {
    //     // return [x + pageMargins.left + i * xInterval, y + height * ( 1 - data / maxDataValue)];
    //     var xPos = x + i * xInterval,
    //         yPos = y + height * ( 1 - data / maxDataValue);

    //     // If we are writing a section of the sequence (not beginning) then assume that the x is positioned right
    //     // after the previous nucleotide letter.
    //     if (fromBase > 0){
    //       xPos += layoutSettings.basePairDims.width/2;
    //     }

    //     return [xPos, yPos];
    //   });
    // });

    // artist.updateStyle({
    //   lineWidth: 1
    // });

    // _.each(allPoints, function(points, i) {
    //   if (points.length){
    //     artist.path(..._.flatten(points), {strokeStyle: colors[i]});
    //   }
    // });

    // artist.smoothLineGraph(points);

    const normalizedWidth = layoutSettings.chromatographDims.width;

    /**
     * Slice the relevant data for a base from the provded raw data array.
     * For base 0, we get the raw data from index 0 to peaks[0].
     * For base peaks.length, we get the raw data from index peaks[peaks.length - 1]
     * to rawData.length - 1.
     *
     * @param  {Array}    data  Individual array of raw chromatograph data (one nucleotide only).
     * @param  {Integer}  base  Index of base.
     * @return {Array}          Raw data of range base-1 to base.
     *                          Base 0 will get rawData[0] to rawData[peak[0]].
     *                          Base peaks.length will get rawData[peaks[peaks.length-1]] to
     *                          rawData[rawData.length - 1]
     */
    function getRelevantData(data, base){
      var start = base === 0 ?
                    0 :
                    peaks[base - 1],

          end   = base === peaks.length ?
                    data.length :
                    peaks[base];

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
          // artist.rect(normalized[0][0], 0, (normalized[normalized.length-1][0]-normalized[0][0]) , 50, {
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
