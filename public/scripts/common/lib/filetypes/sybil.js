define(function(require) {
  var $ = require('jquery'),
      _ = require('underscore');

  //________________________________________________________________________________________
  // SYBIL - SYnthetic Biology Interchange Language

  var FT_base = require('common/lib/filetypes/base'),
      FT_sybil;

  FT_sybil = function() {
    this.typeName = 'SYBIL' ;
  }


  FT_sybil.prototype = new FT_base() ;

  /**
    Implements a SyBIL (SYnthetic Biology Interchange Language) format file reader/writer.
    @class FT_sybil
    @extends FT_base
  */
  FT_sybil.prototype.constructor = FT_sybil ;

  FT_sybil.prototype.getFileExtension = function () {
    return 'sybil' ;
  };

  /**
  @method getExportString
  @param {Sequence} sequence
  @returns {String} Sequence in SYBIL format
  **/
  FT_sybil.prototype.getExportString = function ( sequence ) {
    var s = '' ;
    
    s += "<sybil>\n" ;
    s += "<session>\n" ;
    
    // TODO repo
    // TODO history
    
    s += "<circuit>\n" ;
    
    if ( '' != ( sequence.desc || '' ) ) {
      var o = $('<general_description></general_description>') ;
      o.text ( sequence.desc ) ;
      s += o[0].outerHTML + "\n" ;
    }
    
    $.each ( sequence.features , function ( k , v ) {
      if ( v['_type'].match(/^source$/i) ) return ;
      if ( undefined === v['ranges'] ) return ;
      if ( 0 == v['ranges'].length ) return ;
      
      // Misc
      var type = v['_type'] ;
      var start = v['ranges'][0].from ;
      var stop = v['ranges'][v['ranges'].length-1].to;

      // Name
      var name = '' ;
      if ( v['gene'] !== undefined ) name = v['gene'] ;
      else if ( v['product'] !== undefined ) name = v['product'] ;
      else if ( v['name'] !== undefined ) name = v['name'] ;
      name = name.replace(/^"/,'').replace(/"$/,'') ;
      
      // Description
      var desc = '' ;
      if ( v['note'] !== undefined ) desc = v['note'] ;
      else if ( v['protein'] !== undefined ) desc = v['protein'] ;
      else if ( v['product'] !== undefined ) desc = v['product'] ;
      else if ( v['bound_moiety'] !== undefined ) desc = v['bound_moiety'] ;
      desc = desc.replace(/^"/,'').replace(/"$/,'') ;
      if ( desc != '' ) desc = "\n" + _.ucFirst ( desc ) ;
      desc = desc.trim() ;
      
      if ( 1 != v['ranges'].length ) {
        $.each ( v['ranges'] , function ( k2 , v2 ) {
          desc += "<exon start='" + (v2.from+1) + "' to='" + (v2.to+1) + "' />\n" ;
        } ) ;
      }
      
      var o = $('<annotation></annotation>') ;
      o.text ( desc ) ;
      o.attr ( 'rc' , v['ranges'][0].rc ? 1 : 0 ) ;

      $.each ( v , function ( k2 , v2 ) {
        if ( k2.substr ( 0 , 1 ) == '_' ) return ;
        var k3 = k2.toLowerCase() ;
        if ( k3 == 'translation' ) return ;
        if ( k3 == 'ranges' ) return ;
        var v3 = v2.replace ( /\"/g , '' ) ;
        o.attr ( k2 , v3 ) ;
      } ) ;

      o.attr ( { type:type , start:start+1 , stop:stop+1 } ) ;
      if ( name !== '' ) o.attr ( { name:name } ) ;

      s += o[0].outerHTML + "\n" ;

    } ) ;
    
    var o = $("<sequence></sequence>") ;
    o.text ( sequence.sequence ) ;
    o.attr( { type:'dna' , name:sequence.name } ) ;
    s += o[0].outerHTML + "\n" ;
    
    s += "</circuit>\n" ;
    s += "</session>\n" ;
    s += "</sybil>" ;
    
    // TODO me should do some serious "illegal XML characters" filtering here, but...
    s = s.replace ( /\u0004/g , '' ) ;

    return s ;
  };

  /**
  @method parseFile
  @returns {Array} Array containing the sequence as an object
  **/
  FT_sybil.prototype.parseFile = function () {
    var sybil           = $($.parseXML(this.text)),
        sequences       = [],
        lastFeatureId   = -1;

    sybil.find('session').each ( function ( k1 , v1 ) {
      $(v1).find('circuit').each ( function ( k2 , v2 ) {
        var s = $(v2).find('sequence').get(0) ;
        s = $(s) ;
        var seq = { 
          name: s.attr('name'), 
          sequence: s.text().toUpperCase()
        };
        seq.desc = $(v2).find('general_description').text() ;
        
        seq.features = [] ;
        $(v2).find('annotation').each ( function ( k3 , v3 ) {
          var attrs = _.pluck(_.objectToArray(v3.attributes), 'name');
          var start , stop , rc ;
          var feature = {} ;
          feature.ranges = [] ;
          feature.desc = $(v3).text() ; // TODO exons
          feature._id = ++lastFeatureId;
          $.each ( attrs , function ( dummy , ak ) {
            var av = $(v3).attr(ak) ;
            if ( ak == 'start' ) start = av*1 ;
            else if ( ak == 'stop' ) stop = av*1 ;
            else if ( ak == 'rc' ) rc = ( av == 1 ) ;
            else if ( ak == 'type' ) feature._type = av ;
            else feature[ak] = av ;
          } ) ;
          
          if ( feature.ranges.length === 0 ) {
            feature.ranges = [ { from:start , to:stop , rc:rc } ] ;
          }
          
          seq.features.push ( feature ) ;
        } ) ;
        
        sequences.push ( seq ) ;
      } ) ;
    } ) ;

    return sequences;
  };

  /**
  Checks if a given file matches the filetype.
  @method textHeuristic
  @returns {boolean} True if the file matches, false if not.
  **/
  FT_sybil.prototype.textHeuristic = function () {
    if ( this.text.match ( /^<sybil\b/i ) ) return true ;
    return false ;
  };


  return FT_sybil;

});