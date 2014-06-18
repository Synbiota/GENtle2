define(function(require) {
  //________________________________________________________________________________________
  // ABI
 // For file format description, see http://www6.appliedbiosystems.com/support/software_community/ABIF_File_Format.pdf

  var FT_base = require('common/lib/filetypes/base'),
      FT_abi;

  FT_abi = function() {
    this.typeName = 'ABI' ;
	this.read_binary = true ;
	this.binary = true ;
  }

  FT_abi.prototype = new FT_base() ;

  /**
    Implements a abi file reader/writer.
    @class FT_abi
    @extends Filetype
  */
  FT_abi.prototype.constructor = FT_abi ;



FT_abi.prototype.getBigEndianUnsignedWord = function ( bytes , p ) {
	var n1 = bytes[p+0] * 256 + bytes[p+1] ;
	return n1 ;
}

FT_abi.prototype.getBigEndianSignedWord = function ( bytes , p ) {
	var x = bytes[p+0] * 256 + bytes[p+1] ;
	return x >= 32768 ? x-65536 : x ;
}

FT_abi.prototype.getBigEndianUnsignedLong = function ( bytes , p ) {
//	console.log ( bytes[p+0]*1 , bytes[p+1]*1 , bytes[p+2]*1 , bytes[p+3]*1 ) ;
	var n1 = bytes[p+0] *256*256*256 + bytes[p+1] *256*256 + bytes[p+2] * 256 + bytes[p+3] ;
	return n1 ;
}

  FT_abi.prototype.getFileExtension = function () {
    return 'abi' ;
  }

  FT_abi.prototype.getExportString = function ( sequence ) {
    return 'NOT IMPLEMENTED YET';
  }

  FT_abi.prototype.parseFile = function ( just_check_format ) { // INCOMPLETE Gets sequence but no quality scores, chromatogram, etc.
	var me = this ;

	// START ABI PARSING HERE
	
	function ab2str(buf) {
	  return String.fromCharCode.apply(null, new Uint16Array(buf));
	}

	function str2ab(str) {
	  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	  var bufView = new Uint16Array(buf);
	  for (var i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	  }
	  return buf;
	}

//	var text_array = me.stringToBytes(me.text) ; // THIS HAD TO BE ADDED FOR GENtle3 - possible bug?
//	var text_array = str2ab ( me.text ) ;
	var text_array = me.asArrayBuffer() ;
	if ( typeof text_array == 'undefined' ) return false ;
	var bytes = new Uint8Array(text_array);
	

	// HEADER
	var p = 0 ;
	var abi = {} ;
	abi.magic_number = String.fromCharCode ( bytes[p++] ) + 
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) ;

	if ( abi.magic_number != 'ABIF' ) return false ;
	if ( just_check_format ) return true ;

	abi.version = me.getBigEndianUnsignedWord ( bytes , p ) ; p += 2 ;
	abi.num_version = abi.version / 100 ;
	
	
	function readDir () {
		var ret = {} ;
		ret.name = String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) ;
//		ret.number = String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) ;
		ret.number = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
		ret.elementtype = me.getBigEndianSignedWord(bytes,p); p += 2 ;
		ret.elementsize = me.getBigEndianSignedWord(bytes,p); p += 2 ;
		ret.numelements = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
		ret.datasize = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
		ret.dataoffset_byte = bytes[p] ;
		ret.dataoffset_uword = me.getBigEndianUnsignedWord(bytes,p);
		ret.dataoffset = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
		ret.datahandle = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
		return ret ;
	}
	
	abi.dirs = [] ;
	abi.dir = readDir ( p ) ;
	p = abi.dir.dataoffset ;
	for ( var d = 0 ; d < abi.dir.numelements ; d++ ) {
		var nd = readDir () ;
		abi.dirs.push ( nd ) ;
	}

//	console.log ( abi ) ;

	var name = "Chromatogram" ;
	var seq = {
		name: "Chromatogram",
		desc: '',
		is_circular: false,
		features: [], 
		sequence: '',
		scf:abi // KEEP THE FULL, PARSED DATA
	} ;
	
	function getPstring ( dir ) { // Pascal string?
		var ret = '' ;
		var len = bytes[dir.dataoffset] ;
		for ( var i = 0 ; i < len ; i++ ) ret += String.fromCharCode ( bytes[i+dir.dataoffset+1] ) ;
		return ret ;
	}
	
	function getStringFromCharArray ( dir ) {
		var ret = '' ;
		for ( var i = 0 ; i < dir.datasize ; i++ ) ret += String.fromCharCode ( bytes[i+dir.dataoffset] ) ;
		return ret ;
	}
	
	
	$.each ( abi.dirs , function ( k , v ) {
//		console.log ( v.name , v.number ) ;
		if ( v.name == 'SMPL' && v.number == 1 ) seq.name = getPstring ( v ) ;
		if ( v.name == 'PBAS' && v.number == 1 ) seq.sequence = getStringFromCharArray ( v ) ;
		if ( v.name == 'PBAS' && v.number == 2 && seq.sequence == '' ) seq.sequence = getStringFromCharArray ( v ) ;
	} ) ;
	
	return [ seq ] ;
	}

  FT_abi.prototype.parseText = function ( text ) {
    this.text = text ; // Huh?
    this.fileTypeValidated = true ;
  //  $('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
    this.parseFile () ;
  }

  FT_abi.prototype.textHeuristic = function () {
	var res = this.parseFile ( true ) ;
	return res ;
}

  return FT_abi

});
