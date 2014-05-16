define(function(require) {
  //________________________________________________________________________________________
  // SCF2JSON

  var FT_base = require('lib/files/base'),
      FT_scf2json;

  FT_scf2json = function() {
    this.typeName = 'SCF2JSON' ;
  }

  FT_scf2json.prototype = new FT_base() ;

  /**
    Implements a SCF2JSON file reader/writer.
    @class FT_scf2json
    @extends Filetype
  */
  FT_scf2json.prototype.constructor = FT_scf2json ;

  FT_scf2json.prototype.getFileExtension = function () {
    return 'scf2json' ;
  }

  FT_scf2json.prototype.getExportString = function ( sequence ) {
    return 'NOT IMPLEMENTED YET';
  }

  FT_scf2json.prototype.parseFile = function () {
    var ret = [] ;
    var tempseq = $.parseJSON(this.text);

    var seqtext = '';

    for (i in tempseq) {
      seqtext += tempseq[i]['base'];
    }

    var v = new SequenceDNA ( name , seqtext, tempseq ) ;
    var seqid = gentle.addSequence ( v , true ) ;
    ret.push ( seqid ) ;
    return ret ;
  }

  FT_scf2json.prototype.textHeuristic = function () {
    if ( this.text.match ( /^\[\{/ ) ) return true ;
    return false ;
  }

  return FT_scf2json

});