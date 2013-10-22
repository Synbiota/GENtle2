var Benchmark = require('benchmark')
  , Sequence = require('../scripts/models/sequence')
  , suite = new Benchmark.Suite;

function generateSuperLongString(block_size, block_nb) {
  var A = 65
    , Z = 90
    , str = "";

  for(var i = 0; i < block_nb; i++) {
    var str_a = [];
    for(var j = 0; j < block_size; j++) {
      str_a[j] = (Math.random() * (Z - A) + A)|0;
    }
    str = str + String.fromCharCode.apply(null, str_a);
  }
  return str
}


suite.add('Sequence#getFromBuffer', function(){
  var s = new Sequence(generateSuperLongString(100,1000))
    , c = s.length
    , start = (Math.random()*(s.length-1))|0
    , end = (Math.random()*(s.length-1-start)+start)|0;
  s.getFromBuffer(start, end);
}).add('Sequence#getFromString', function(){
  var s = new Sequence(generateSuperLongString(100,1000))
    , c = s.length
    , start = (Math.random()*(s.length-1))|0
    , end = (Math.random()*(s.length-1-start)+start)|0;
  s.getFromString(start, end);
})

suite.on('cycle', function(event) {
  console.log(String(event.target));
}).on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
}).run({
  'async': true,
  'minSamples': 200
});

 