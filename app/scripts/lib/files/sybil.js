define(function(require) {
  //________________________________________________________________________________________
  // SYBIL - SYnthetic Biology Interchange Language

  var FT_base = require('lib/files/base'),
      FT_sybil;

  FT_sybil = function() {
    this.typeName = 'SYBIL' ;
  }


  FT_sybil.prototype = new FT_base() ;

  /**
    Implements a SyBIL (SYnthetic Biology Interchange Language) format file reader/writer.
    @class FT_sybil
    @extends Filetype
  */
  FT_sybil.prototype.constructor = FT_sybil ;

  FT_sybil.prototype.getFileExtension = function () {
    return 'sybil' ;
  }

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
      s += o.outerHTML() + "\n" ;
    }
    
    $.each ( sequence.features , function ( k , v ) {
      if ( v['_type'].match(/^source$/i) ) return ;
      if ( undefined === v['_range'] ) return ;
      if ( 0 == v['_range'].length ) return ;
      
      // Misc
      var type = v['_type'] ;
      var start = v['_range'][0].from ;
      var stop = v['_range'][v['_range'].length-1].to ;

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
      if ( desc != '' ) desc = "\n" + ucFirst ( desc ) ;
      desc = desc.trim() ;
      
      if ( 1 != v['_range'].length ) {
        $.each ( v['_range'] , function ( k2 , v2 ) {
          desc += "<exon start='" + v2.from + "' to='" + v2.to + "' />\n" ;
        } ) ;
      }
      
      var o = $('<annotation></annotation>') ;
      o.text ( desc ) ;
      o.attr ( 'rc' , v['_range'][0].rc ? 1 : 0 ) ;

      $.each ( v , function ( k2 , v2 ) {
        if ( k2.substr ( 0 , 1 ) == '_' ) return ;
        var k3 = k2.toLowerCase() ;
        if ( k3 == 'translation' ) return ;
        var v3 = v2.replace ( /\"/g , '' ) ;
        o.attr ( k2 , v3 ) ;
      } ) ;

      o.attr ( { type:type , start:start , stop:stop } ) ;
      if ( name != '' ) o.attr ( { name:name } ) ;

      s += o.outerHTML() + "\n" ;

    } ) ;
    
    var o = $("<sequence></sequence>") ;
    o.text ( sequence.seq ) ;
    o.attr( { type:'dna' , name:sequence.name } ) ;
    s += o.outerHTML() + "\n" ;
    
    s += "</circuit>\n" ;
    s += "</session>\n" ;
    s += "</sybil>" ;
    
    // TODO me should do some serious "illegal XML characters" filtering here, but...
    s = s.replace ( /\u0004/g , '' ) ;

    return s ;
  }

  FT_sybil.prototype.parseFile = function () {
    var ret = [] ;
    var sybil = $.parseXML(this.text) ;
    sybil = $(sybil) ;
    
    var tempseq = [] ;

    sybil.find('session').each ( function ( k1 , v1 ) {
      $(v1).find('circuit').each ( function ( k2 , v2 ) {
        var s = $(v2).find('sequence').get(0) ;
        s = $(s) ;
        var seq = new SequenceDNA ( s.attr('name') , s.text().toUpperCase() ) ;
        seq.desc = $(v2).find('general_description').text() ;
        
        seq.features = [] ;
        $(v2).find('annotation').each ( function ( k3 , v3 ) {
          var attrs = $(v3).listAttributes() ;
          var start , stop , rc ;
          var feature = {} ;
          feature['_range'] = [] ;
          feature.desc = $(v3).text() ; // TODO exons
          $.each ( attrs , function ( dummy , ak ) {
            var av = $(v3).attr(ak) ;
            if ( ak == 'start' ) start = av*1 ;
            else if ( ak == 'stop' ) stop = av*1 ;
            else if ( ak == 'rc' ) rc = ( av == 1 ) ;
            else if ( ak == 'type' ) feature['_type'] = av ;
            else feature[ak] = av ;
          } ) ;
          
          if ( feature['_range'].length == 0 ) {
            feature['_range'] = [ { from:start , to:stop , rc:rc } ] ;
          }
          
  //        console.log ( JSON.stringify ( feature ) ) ;
          
          seq.features.push ( feature ) ;
        } ) ;
        
        tempseq.push ( seq ) ;
      } ) ;
    } ) ;
    
    
    $.each ( tempseq , function ( k , v ) {
      var seqid = gentle.addSequence ( v , true ) ;
      ret.push ( seqid ) ;
    } ) ;

    return ret ;
  }

  FT_sybil.prototype.textHeuristic = function () {
    if ( this.text.match ( /^<sybil\b/i ) ) return true ;
    return false ;
  }


  return FT_sybil;

});