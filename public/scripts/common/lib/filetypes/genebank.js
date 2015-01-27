define(function(require) {
  //________________________________________________________________________________________
  // GeneBank

  var FT_base = require('./base'),
      _       = require('underscore.mixed'),
      FT_genebank;

  FT_genebank = function() {
    this.typeName = 'GeneBank' ;
  }

  FT_genebank.prototype = new FT_base() ;

  /**
    Implements a GenBank format file reader/writer.
    @class FT_genebank
    @extends Filetype
  */
  FT_genebank.prototype.constructor = FT_genebank ;

  FT_genebank.prototype.textHeuristic = function () {
    if ( this.asString().match ( /^LOCUS\s+/i ) ) return true ;
    return false ;
  }


  FT_genebank.prototype.parseText = function ( text ) {
    this.ascii = text ;
    this.fileTypeValidated = true ;
  //  $('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
    this.parseFile () ;
  }

  FT_genebank.prototype.parseFile = function () {
    var ret = [] ;
    var lines = this.asString().replace(/\r/g,'').split ( "\n" ) ;

    var mode = '' ;
    var seq = {features: [], sequence: ''} ;
    seq.desc = '' ;
    var feature = {} ;
    $.each ( lines , function ( k , v ) {

      if ( v.match(/^LOCUS/i) ) {
        var m = v.match(/^LOCUS\s+(\S+)\s+(.+)$/i)
        seq.name = m[1] ;
        seq.isCircular = m[2].match(/\bcircular\b/i) ? true : false ;
        return ;
      } else if ( v.match(/^DEFINITION\s+(.+)$/i) ) {
        var m = v.match(/^DEFINITION\s+(.+)$/i) ;
        seq.name = m[1] ;
      } else if ( v.match(/^FEATURES/i) ) {
        mode = 'FEATURES' ;
        return ;
      } else if ( v.match(/^REFERENCE/i) ) {
        mode = 'REFERENCE' ;
        return ;
      } else if ( v.match(/^COMMENT\s+(.+)$/i) ) {
        mode = 'COMMENT' ;
        var m = v.match(/^COMMENT\s+(.+)$/i) ;
        seq.desc += m[1] + "\n" ;
        return ;
      } else if ( v.match(/^ORIGIN/i) ) {
        if ( feature['_last'] ) seq.features.push ( $.extend(true, {}, feature) ) ;
        mode = 'ORIGIN' ;
        return ;
      }
      
      if ( mode == 'FEATURES' ) { // Note that leading spaces have some "leeway"...
      
        var m = v.match ( /^\s{1,8}(\w+)\s+(.+)$/ ) ;
        if ( m ) { // Begin feature
          if ( feature['_last'] ) seq.features.push ( $.extend(true, {}, feature) ) ;
          feature = { _importData: {}, _id: _.uniqueId() } ;
          feature['_type'] = m[1] ;
          feature['ranges'] = m[2] ;
          feature['_last'] = 'ranges' ;
          return ;
        }
        
        m = v.match ( /^\s{8,21}\/(\w+)\s*=\s*(.+)\s*$/ ) ;
        if ( m ) { // Begin new tag
          m[1] = m[1].replace ( /^"/ , '' ) ;
          feature['_last'] = m[1] 
          feature._importData[m[1]] = m[2].replace(/^"/, '').replace(/"$/, '') ;
          return ;
        }
        
        m = v.match ( /^\s{18,21}\s*(.+)\s*$/ ) ;
        if ( m ) { // Extend tag
          //if ( null !== feature[feature['_last']].match(/^[A-Z]+$/) )
          m[1] = m[1].replace ( /"$/ , '' ) ;
          if ( m[1].match(/^[A-Z]+$/) === null ) feature._importData[feature['_last']] += " " ;
          feature._importData[feature['_last']] += m[1] ;
        }
      
      } else if ( mode == 'REFERENCE' ) {
        seq.desc += v + "\n" ;
      
      } else if ( mode == 'ORIGIN' ) {
      
        if ( v.match(/^\/\//) ) return false ; // The absolute end
        seq.sequence += v.replace ( /[ 0-9]/g , '' ).toUpperCase() ;
        
      }
    } ) ;
    
    // Cleanup features
    seq.features = _.map(_.reject(seq.features, function(feature) {
      return feature._type == 'source';
    }), function ( v, k ) {
      delete v['_last'] ;
      var range = [] ; // Default : Unknown = empty TODO FIXME
      var r = v['ranges'] ;
      v.name = v._importData.product || v._importData.gene || 'Unnamed';
      v.desc = v._importData.note || '';
      
      var m = r.match ( /^\d+$/ ) ;
      if ( m ) {
        range.push ( { from : r*1 -1, to : r*1 -1, reverseComplement : false } ) ;
        v['ranges'] = range ;
        return v;
      }
      
      m = r.match ( /^[<>]?(\d+)\.\.[<>]?(\d+)$/ ) ;
      if ( m ) {
        range.push ( { from : m[1]*1 -1, to : m[2]*1 -1, reverseComplement : false } ) ;
        v['ranges'] = range ;
        return v;
      }
      
      m = r.match ( /^complement\([<>]?(\d+)\.\.[<>]?(\d+)\)$/i ) ;
      if ( m ) {
        range.push ( { from : m[1]*1 -1, to : m[2]*1 -1, reverseComplement : true } ) ;
        v['ranges'] = range ;
        return v;
      }
      
      console.log ( "Could not parse range " + r ) ;
      v['ranges'] = range ;
      return v;
    } ) ;
    
  //  console.log ( JSON.stringify ( seq.features ) ) ;
    
    return [seq];
  }

  return FT_genebank;
});
