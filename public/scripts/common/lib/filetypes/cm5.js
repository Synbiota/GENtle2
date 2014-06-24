define(function(require) {
  //________________________________________________________________________________________
  // Clone Manager CM5

  var FT_base = require('common/lib/filetypes/base'),
      FT_cm5;

  FT_cm5 = function() {
    this.typeName = 'Clone Manager' ;
    this.read_binary = true ;
  }


  FT_cm5.prototype = new FT_base() ;

  /**
    Implements a CloneManager (CM5) format file reader.
    @class FT_cm5
    @extends Filetype
  */
  FT_cm5.prototype.constructor = FT_cm5 ;

  FT_cm5.prototype.textHeuristic = function () {
    return this.parseFile ( true ) ;
  }


  FT_cm5.prototype.parseText = function ( text ) {
    this.text = text ;
    this.fileTypeValidated = true ;
  //  $('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
    this.parseFile () ;
  }

  FT_cm5.prototype.getLittleEndianUnsignedWord = function ( bytes , p ) {
    var n1 = bytes[p+1] * 256 + bytes[p+0] ;
    return n1 ;
  }

  FT_cm5.prototype.parseFile = function ( heuristic ) {
    var me = this ;

	var text_array = me.asArrayBuffer() ;
	if ( typeof text_array == 'undefined' ) return false ;
	var bytes = new Uint8Array(text_array);

    if ( bytes[0] != 26 || bytes[1] != 83 || bytes[2] != 69 || bytes[3] != 83 ) return false ; // CHECK HEURISTIC!
    
    var seq = { name:'' , sequence:'' , desc:'' } ;

    var feat_start = [] ;
    for ( var p = 4 ; p < bytes.length ; p++ ) {
      if ( bytes[p-3] != 255 || bytes[p-2] != 255 || bytes[p-1] != 0 || bytes[p] != 0 ) continue ;
      feat_start.push ( p+5 ) ;
    }
    
    var seq_start ;
    seq.features = [] ;
    $.each ( feat_start , function ( dummy , p ) {
      var type = '' ;
      while ( bytes[p] > 0 ) type += String.fromCharCode ( bytes[p++] ) ;
      if ( type == '' || type == 'source' ) return ;
      p++ ;
      p += 4 ; // Dunno what this is
      var from = me.getLittleEndianUnsignedWord ( bytes , p ) ;
      p += 4 ; // Skipping two bytes
      var to = me.getLittleEndianUnsignedWord ( bytes , p ) ;
      if ( from == 0 && to == 0 ) return ;
      p += 4 ; // Skipping two bytes
      p += 4 ; // Dunno what this is

      var shortname = '' ;
      while ( bytes[p] > 0 ) shortname += String.fromCharCode ( bytes[p++] ) ;
      p++ ;
      var name = '' ;
      while ( bytes[p] > 0 ) name += String.fromCharCode ( bytes[p++] ) ;
      p++ ;
      seq_start = p ;
      
      var rc = to < from ;
      if ( rc ) { var i = from ; from = to ; to = i ; }
      
      var feature = {} ;
      feature.name = shortname ;
      feature.desc = name ;
      feature['ranges'] = [ { from:from , to:to , rc:rc } ] ;
      feature['_type'] = type ; //gentle.getFeatureType ( type ) ; // TODO normalize type
      seq.features.push ( feature ) ;
      
  //    console.log ( type + " : " + from + "-" + to + (rc?" RC":"") + " [" + shortname + "] " + name ) ;
    } ) ;
    
    // Actual sequence
    var p ;
    for ( p = seq_start ; bytes[p] > 0 ; p++ ) seq.sequence += String.fromCharCode ( bytes[p] ) ;
    p++ ;
    
    var number_of_enzymes = me.getLittleEndianUnsignedWord ( bytes , p ) ;
    p += 4 ; // Skipping two bytes
    var enzymes = [] ;
    for ( var i = 0 ; i < number_of_enzymes ; i++ ) {
      var s = '' ;
      while ( bytes[p] > 0 ) s += String.fromCharCode ( bytes[p++] ) ;
      p++ ;
      enzymes.push ( s ) ;
    }
    // TODO somehow use enzymes
    
    p = bytes.length - 2 ;
    while ( bytes[p] > 0 ) p-- ;
    p-- ;
    while ( bytes[p] > 0 ) p-- ;
    p++ ;
    
    while ( bytes[p] > 0 ) seq.name += String.fromCharCode ( bytes[p++] ) ;
    p++ ;
    while ( bytes[p] > 0 ) seq.desc += String.fromCharCode ( bytes[p++] ) ;
    
    if ( heuristic ) return true ;
    return [ seq ] ;
  }

  FT_cm5.prototype.getExportString = function ( sequence ) { // TODO
    return '' ;
  }

  return FT_cm5;
});