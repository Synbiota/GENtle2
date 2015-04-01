
//________________________________________________________________________________________
// Clone Manager CM5 Text

import FT_base from './base';

var FT_cm5_text = function() {
  this.typeName = 'Clone Manager 5, text' ;
};


FT_cm5_text.prototype = new FT_base() ;


/**
  Implements a CloneManager (CM5) format file reader.
  @class FT_cm5_text
  @extends Filetype
*/
FT_cm5_text.prototype.constructor = FT_cm5_text ;


FT_cm5_text.prototype.textHeuristic = function () {
  return this.parseFile ( true ) ;
};


FT_cm5_text.prototype.parseText = function ( text ) {
  this.text = text ;
  this.fileTypeValidated = true ;
  //  $('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
  this.parseFile () ;
};


FT_cm5_text.prototype.parseFile = function ( heuristic ) {
  var lines = this.asString().replace(/\r/g,'').split ( "\n" ) ;
  if ( lines.length < 2 ) return false ;

  var seq = { name:'' , sequence:'' , desc:'' } ;

  if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
  var seqlen = lines.shift() * 1 ;

  if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
  var number_of_enzymes = lines.shift() * 1 ;

  var enzymes = {} ;
  for ( var i = 0 ; i < number_of_enzymes ; i++ ) {
    enzymes[lines.shift()] = 1 ;
    if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
    lines.shift() ; // Position of cut, apparently; irrelevant
  }

  if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
  var number_of_features = lines.shift() * 1 ;

  seq.features = [] ;
  for ( var i = 0 ; i < number_of_features ; i++ ) {
    var feature = {} ;
    var name_desc = lines.shift() ;
    var m = name_desc.match ( /^(.+)\x00(.*)$/ ) ;

    feature.name = m[1] || '' ;
    feature.desc = m[2] || '' ;
    feature.ranges = [] ;
    if ( feature.desc.match(/\bterminator\b/i) ) feature._type = 'terminator' ;
    else if ( feature.desc.match(/\bpromoter\b/i) ) feature._type = 'promoter' ;
    else if ( feature.desc.match(/\bcds\b/i) ) feature._type = 'cds' ;
    else if ( feature.desc.match(/\bcoding sequence\b/i) ) feature._type = 'cds' ;
    else if ( feature.desc.match(/\bgene\b/i) ) feature._type = 'gene' ;
    else if ( feature.desc.match(/\brbs\b/i) ) feature._type = 'rbs' ;
    else feature._type = 'misc' ;

    if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
    var start = lines.shift() * 1 ;
    if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
    var stop = lines.shift() * 1 ;
    var dir = lines.shift() ;
    var rc = (dir=='ccw') ;
    feature.ranges.push ( { from:(rc?stop:start) , to:(rc?start:stop) , rc:rc } ) ;

    lines.shift() ; // TODO unknown row, seems to be always "N"
    seq.features.push ( feature ) ;
  }

  // Don't know what these are...
  if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
  var number_of_unknown_things = lines.shift() * 1 ;

  for ( var i = 0 ; i < number_of_unknown_things ; i++ ) {
    lines.shift() ;

    if ( lines.length == 0 || !lines[0].match(/^\d+$/) ) return false ;
    var pos = lines.shift() * 1 ;

    lines.shift() ; // TODO what is that?
  }

  if ( lines.length < 2 || lines[0] != 'sequence' ) return false ;
  lines.shift() ;
  seq.seq = lines.shift().toUpperCase() ;
  if ( seq.seq.length != seqlen ) return false ;

  $.each ( lines , function ( k , v ) {
    if ( v == 'description' || v == 'annotations' ) return ;
    if ( v[0] != ';' && seq.desc.length > 0 ) seq.desc += "\n" ;
    seq.desc += v ;
  } );

  if ( !heuristic ) gentle.addSequence ( seq , true ) ;
  return true ;
};


FT_cm5_text.prototype.getExportString = function ( sequence ) { // TODO
  return '' ;
};


export default FT_cm5_text;
