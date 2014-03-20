define(function(require) {
  //________________________________________________________________________________________
  // FASTA

  var FT_base = require('lib/files/base'),
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
    var lines = this.text.replace(/\r/g,'').split ( "\n" ) ;
    var name = '' ;
    var seq = '' ;
    var tempseq = [] ;
    $.each ( lines , function ( k , v ) {
      if ( v.match ( /^>/ ) ) {
        if ( seq !== '' ) tempseq.push ( new SequenceDNA ( name , seq ) ) ;
        name = v.replace ( /^>\s*/ , '' ) ;
        seq = '' ;
      } else {
        seq += v.replace ( /\s/g , '' ).toUpperCase() ;
      }
    } ) ;
    if ( seq !== '' ) tempseq.push ( new SequenceDNA ( name , seq ) ) ;
    
    $.each ( tempseq , function ( k , v ) {
      var seqid = gentle.addSequence ( v , true ) ;
      ret.push ( seqid ) ;
    } ) ;
    return ret ;
  };

  FT_fasta.prototype.textHeuristic = function () {
    if ( this.text.match ( /^\>/ ) ) return true ;
    return false ;
  };

  return FT_fasta;
});