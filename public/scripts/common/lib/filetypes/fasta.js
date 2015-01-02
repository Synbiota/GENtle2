define(function(require) {
  //________________________________________________________________________________________
  // FASTA

  var FT_base = require('./base'),
      FT_fasta;

  FT_fasta = function() {
    this.typeName = 'FASTA' ;
  };

  FT_fasta.prototype = new FT_base() ;

  /**
    Implements a FASTA file reader/writer.
    @class FT_fasta
    @extends Filetype
  */
  FT_fasta.prototype.constructor = FT_fasta ;

  FT_fasta.prototype.getFileExtension = function () {
    return 'fasta' ;
  };

  FT_fasta.prototype.getExportString = function ( sequence ) {
    var ret = '' ;
    ret += ">" + sequence.name + "\n" ;
    var s = sequence.seq ;
    while ( s !== '' ) {
      ret += s.substr ( 0 , 60 ) + "\n" ;
      s = s.substr ( 60 , s.length-60 ) ;
    }
    return ret ;
  };

  FT_fasta.prototype.parseFile = function () {
    var ret = [] ;
    var lines = this.asString().replace(/\r/g,'').split ( "\n" ) ;
    var name = '' ;
    var seq = '' ;
    $.each ( lines , function ( k , v ) {
      if ( v.match ( /^>/ ) ) {
        if ( seq !== '' ) ret.push ( { name:name , sequence:seq } ) ;
        name = v.replace ( /^>\s*/ , '' ) ;
        seq = '' ;
      } else {
        seq += v.replace ( /\s/g , '' ).toUpperCase() ;
      }
    } ) ;
    if ( seq !== '' ) ret.push ( { name:name , sequence:seq } ) ;
    
    return ret ;
  };

  FT_fasta.prototype.textHeuristic = function () {
    if ( this.asString().match ( /^\>/ ) ) return true ;
    return false ;
  };

  return FT_fasta;
});