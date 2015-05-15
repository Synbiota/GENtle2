/**
    Filetype base class
    @class FT_base
    @module Filetypes
**/
// define(function(require) {
  function FT_base () {
    this.fileTypeValidated = false ;
    this.typeName = 'none' ;
  }

  FT_base.prototype._shl = function (a, b){
    for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
    return a;
  };
  
	FT_base.prototype.ab2str = function (buf) {
		var str = "";
		var ab = new Uint8Array(buf);
		var abLen = ab.length;
		var CHUNK_SIZE = Math.pow(2, 16);
		var offset, len, subab;
		for (offset = 0; offset < abLen; offset += CHUNK_SIZE) {
			len = Math.min(CHUNK_SIZE, abLen-offset);
			subab = ab.subarray(offset, offset+len);
			str += String.fromCharCode.apply(null, subab);
		}
		return str;
	}

  FT_base.prototype.asString = function () {
  	var me = this ;
  	if ( typeof me.ascii != 'undefined' ) return me.ascii ;
  	if ( typeof me.array_buffer == 'undefined' ) me.ascii = '' ;
	else {
//		var uint8 = new Uint8Array(me.array_buffer) ;
		me.ascii = me.ab2str(me.array_buffer);//String.fromCharCode.apply(null, uint8);
	}
  	return me.ascii ;
  }
  
  FT_base.prototype.asArrayBuffer = function () {
  	return this.array_buffer ;
  }

  FT_base.prototype.stringToBytes = function ( str ) {
  /*
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    
    console.log ( bufView ) ;
    
    return buf;
  */
    var re = [] ;
    for ( var i = 0 ; i < str.length ; i++ ) re.push ( this._shl ( str.charCodeAt(i) ) ) ;
    return re ;
  /*  var ch, st, re = [];
    for (var i = 0; i < str.length; i++ ) {
      ch = str.charCodeAt(i);  // get char 
      st = [];                 // set up "stack"
      do {
        st.push( ch & 0xFF );  // push byte to stack
        ch = ch >> 8;          // shift value down by 1 byte
      }  
      while ( ch );
      // add stack contents to result
      // done because chars have "wrong" endianness
      re = re.concat( st.reverse() );
    }
    // return an array of bytes
    return re;*/
  }

  // /**
  //   Checks if a file matches this filetype, and then parses it. Does not return a result, but informs the gentle object that a match was found.
  //   @method loadFile
  //   @param {file} f The file.
  // **/
  // FT_base.prototype.loadFile = function ( f ) {
  //   this.file = f ;
  //   var reader = new FileReader();
  //   var _this = this ;
    
  //   // Closure to capture the file information.
  //   reader.onload = (function(theFile) {
  //     return function(e) {
  //       if ( f.isIdentified ) return ;
  //       _this.text = e.target.result ;
  //       if ( !_this.textHeuristic() ) return ;
  //       f.isIdentified = true ;
  //       _this.fileTypeValidated = true ;
  //       // gentle.fileLoaded ( _this ) ;
  //       // _this.parseFile () ;
  //     };
  //   })(f);
    
  //   // Read in the image file as a data URL.
  //   if ( this.read_binary ) reader.readAsArrayBuffer ( f ) ;
  //   else reader.readAsText(f);
  // }

  /**
    Returns a string for file export.
    @return {string} The string representing the sequence.
  */
  FT_base.prototype.getExportString = function ( sequence ) {
    return '' ;
  }

  FT_base.prototype.getExportBlob = function ( sequence ) {
    var ret = { error : false } ;
    
    var t = this.getExportString ( sequence ) ;
    if ( t == '' ) {
      ret.error = true ;
      return ret ;
    }

    ret.filetype = "text/plain;charset=utf-8" ;

    try {
      var dt = [ t ] ;
      ret.blob = new Blob ( dt , { type:"text/plain;charset=utf-8" } ) ;
    } catch ( e ) {
      alert('Could not export file');
      ret.error = true;
    }

    if ( undefined === ret.blob ) return { error : true } ; // Paranoia

    
    return ret ;
  }

  /**
    Checks if a given file matches the filetype.
    @returns {bool} True if the file matches, false if not.
  */
  FT_base.prototype.textHeuristic = function () {
    return false ;
  }

  /**
  Check if text corresponds to parser and returns sequence(s)
  @method checkAndParseText
  @returns {Array} Array of parsed sequences
  **/
  FT_base.prototype.checkAndParseText = function (text) {
    this.ascii = text ;
    if ( !this.textHeuristic() ) return false ;
    this.fileTypeValidated = true ;
    return this.parseFile();
  }

  /**
  Check if text corresponds to parser and returns sequence(s)
  @method checkAndParseText
  @returns {Array} Array of parsed sequences
  **/
  FT_base.prototype.checkAndParseArrayBuffer = function (ab) {
    this.array_buffer = ab ;
    if ( !this.textHeuristic() ) return false ;
    this.fileTypeValidated = true ;
    return this.parseFile();
  }

  FT_base.prototype.parseFile = function () {
    console.log ( "FT_base.parseFile should never be called!" ) ;
    return [] ;
  }

  FT_base.prototype.parseText = function () {
    console.log ( "FT_base.parseText should never be called!" ) ;
  }

  FT_base.prototype.getFileExtension = function () {
    return '' ;
  }
export default FT_base;
  // return FT_base;
// });