
import $ from 'jquery';
import _ from 'underscore';

var getArrayElementName = function(key) {
  return /s$/.test(key) ? 
    key.substr(0, key.length - 1) : 
    key + '-item';
};

var convertToXML = function(data, namespace) {
  var formatKeyName = function(key) { 
    return _.snakify(key).replace(/_/g, '-');
  };
  var createElement = function(key) {
    return $('<'+formatKeyName(key)+'/>');
  };
  var getHTML = function(elements) {
    return createElement('div').append(elements).html();
  };

  if(_.isArray(data)) {
    return getHTML(_.map(data, function(value) {
      value = convertToXML(value);
      if(_.isUndefined(namespace)) {
        return value;
      } else {
        return createElement(namespace).append(value);
      }
    }));
  } else if(_.isObject(data) && !_.isDate(data)) {
    return getHTML(_.map(data, function(value, key) {
      return createElement(key).append(convertToXML(value, getArrayElementName(key)));
    }));
  } else {
    return data;
  }
};

var convertToObject = function(xml) {
  var formatKey = function(string) {
    return _.camelize(string.toLowerCase());
  };
  var formatContent = function(string) {
    return /^[0-9]+(\.[0-9]+)?$/.test(string) ? parseFloat(string) : string;
  };
  var areArrayElements = function(parentNodeName, contents) {
    var uniqueTagNames = _.compact(_.uniq(_.pluck(contents, 'tagName')));
    return uniqueTagNames.length == 1 && parentNodeName &&
      getArrayElementName(parentNodeName) == formatKey(uniqueTagNames[0]);
  };

  return _.reduce($(xml), function(memo, element) {
    var key = formatKey(element.nodeName);
    var contents = $(element).contents();

    if(contents.length == 1 && contents[0].nodeType == 3) {
      memo[key] = formatContent(contents.text());
    } else if(areArrayElements(key, contents)){
      memo[key] = _.map(contents, function(childElement) {
        return convertToObject($(childElement).contents());
      });
    } else {
      memo[key] = convertToObject(contents);
    }

    return memo;
  }, {});
};

//________________________________________________________________________________________
// SYBIL - SYnthetic Biology Interchange Language

var FT_base = require('./base'),
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

  // Sticky ends
  var stickyEnds = sequence.stickyEnds;
  if(stickyEnds) {
    var oo;
    var startStickyEnd = stickyEnds.start;
    var endStickyEnd = stickyEnds.end;

    if(startStickyEnd) {
      oo = $('<sticky-end/>');
      oo.text(startStickyEnd.name);
      oo.attr({
        position: 'start',
        offset: startStickyEnd.offset,
        size: startStickyEnd.size,
        reverse: (!!startStickyEnd.reverse).toString()
      });

      s += oo[0].outerHTML + "\n";
    }

    if(endStickyEnd) {
      oo = $('<sticky-end/>');
      oo.text(endStickyEnd.name);
      oo.attr({
        position: 'end',
        offset: endStickyEnd.offset,
        size: endStickyEnd.size,
        reverse: (!!endStickyEnd.reverse).toString()
      });

      s += oo[0].outerHTML + "\n";
    }


  }
  
  // Features
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

    
    o = $('<annotation></annotation>') ;
    o.text ( desc ) ;
    o.attr ( 'rc' , v['ranges'][0].reverseComplement ? 1 : 0 ) ;

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
  
  o = $("<sequence></sequence>") ;
  o.text ( sequence.sequence ) ;
  o.attr( { type:'dna' , name:sequence.name, circular: sequence.isCircular || 'false' } ) ;
  s += o[0].outerHTML + "\n" ;

  var validMetaKeys = ['pcr'];
  if(_.isObject(sequence.meta) && _.has.apply(null, [sequence.meta].concat(validMetaKeys))) {
    var data = _.pick.apply(null, [sequence.meta].concat(validMetaKeys))
    s += convertToXML({metadata: data});
  }

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
  var sybil           = $($.parseXML(this.asString())),
      sequences       = [];

  sybil.find('session').each ( function ( k1 , v1 ) {
    $(v1).find('circuit').each ( function ( k2 , v2 ) {
      var s = $(v2).find('sequence').get(0) ;
      s = $(s) ;
      var seq = { 
        name: s.attr('name'), 
        sequence: s.text().toUpperCase(),
        isCircular: s.attr('circular') == "true"
      };
      seq.desc = $(v2).find('general_description').text() ;

      $(v2).find('sticky-end').each( function (i, e) {
        var $e = $(e);
        seq.stickyEnds = seq.stickyEnds || {};
        seq.stickyEnds[$e.attr('position')] = {
          name: $(e).text(),
          offset: $(e).attr('offset')^0,
          size: $(e).attr('size')^0,
          reverse: ($(e).attr('reverse') || 'false').toLowerCase() === 'true'
        };
      });
      
      seq.features = [] ;
      $(v2).find('annotation').each ( function ( k3 , v3 ) {
        var attrs = _.pluck(_.objectToArray(v3.attributes), 'name');
        var start , stop , rc ;
        var feature = {} ;
        feature.ranges = [] ;
        feature.desc = $(v3).text() ; // TODO exons
        feature._id = _.uniqueId();
        $.each ( attrs , function ( dummy , ak ) {
          var av = $(v3).attr(ak) ;
          if ( ak == 'start' ) start = av*1 - 1 ;
          else if ( ak == 'stop' ) stop = av*1 - 1 ;
          else if ( ak == 'rc' ) rc = ( av == 1 ) ;
          else if ( ak == 'type' ) feature._type = av ;
          else feature[ak] = av ;
        } ) ;
        
        if ( feature.ranges.length === 0 ) {
          feature.ranges = [ { from:start , to:stop , reverseComplement:rc } ] ;
        }
        
        seq.features.push ( feature ) ;
      } ) ;

      var $metadata = $(v2).find('metadata').contents();
      if($metadata.length) {
        seq.meta = convertToObject($metadata);
      }
      
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
  if ( this.asString().match ( /^<sybil\b/i ) ) return true ;
  return false ;
};


export default FT_sybil;