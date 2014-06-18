define(function(require) {
  //________________________________________________________________________________________
  // ABI
 // See file type doc here: http://staden.sourceforge.net/manual/formats_unix_3.html#SEC3
 // For V3.1 RfC, see http://staden.sourceforge.net/abi-rfc.html

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
	var n1 = bytes[p+0] *256*256*256 + bytes[p+1] *256*256 + bytes[p+2] * 256 + bytes[p+3] ;
	return n1 ;
}

  FT_abi.prototype.getFileExtension = function () {
    return 'abi' ;
  }

  FT_abi.prototype.getExportString = function ( sequence ) {
    return 'NOT IMPLEMENTED YET';
  }

  FT_abi.prototype.parseFile = function ( just_check_format ) {
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
	var text_array = me.text ;
//	console.log ( text_array ) ;
//	var me_text = String.fromCharCode.apply(null, new Uint16Array(text_array)) ;
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
		ret.number = String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) + String.fromCharCode ( bytes[p++] ) ;
		ret.elementtype = me.getBigEndianSignedWord(bytes,p); p += 2 ;
		ret.elementsize = me.getBigEndianSignedWord(bytes,p); p += 2 ;
		ret.numelements = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
		ret.datasize = me.getBigEndianUnsignedLong(bytes,p); p += 4 ;
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

	console.log ( abi ) ;
/*
	
		var me = this ;

	// START ABI PARSING HERE

	var text_array = me.stringToBytes(me.text) ; // THIS HAD TO BE ADDED FOR GENtle3 - possible bug?
	var me_text = String.fromCharCode.apply(null, new Uint16Array(text_array)) ;
	var bytes = new Uint8Array(text_array);
	

	// HEADER
	var p = 0 ;
	var abi = {} ;
	abi.magic_number = String.fromCharCode ( bytes[p++] ) + 
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) ;

	if ( abi.magic_number != '.abi' ) return false ;
	if ( just_check_format ) return true ;

	abi.samples = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ; // Number of raw data points
	abi.samples_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.bases = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.bases_left_clip = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.bases_right_clip = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.bases_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.comments_size = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.comments_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	
	abi.version = String.fromCharCode ( bytes[p++] ) + 
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) ;
	abi.num_version = abi.version * 1 ;
	
	abi.sample_size = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ; // 2=two bytes
	abi.code_set = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.private_size = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	abi.private_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	
	for ( var i = 0 ; i < 18 ; i++ ) {
		var dummy = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	}
	
	
	if ( abi.num_version >= 3 ) { // V 3.0 and above
	
		var bytesize = abi.num_version == 1 ? 1 : 2 ;
		abi.data = [] ; // Raw point data
		var p = abi.samples_offset ;
		var chunksize = abi.sample_size * abi.samples ; // Offsets for C, G, T
		for ( var point = 0 ; point < abi.samples ; point++ ) {
			var o = {
				A : me.getBigEndianSignedWord ( bytes , p+chunksize*0 ) ,
				C : me.getBigEndianSignedWord ( bytes , p+chunksize*1 ) ,
				G : me.getBigEndianSignedWord ( bytes , p+chunksize*2 ) ,
				T : me.getBigEndianSignedWord ( bytes , p+chunksize*3 )
			} ;
			abi.data[point] = o ;
			p += abi.sample_size ;
		}

		// Applying diff
		var num_samples = abi.samples ;
		$.each ( ['A','C','G','T'] , function ( dummy , base ) {
			var p_sample = 0 ;
			for (var i=0;i<num_samples;i++) {
				abi.data[i][base] += p_sample ;
				p_sample = abi.data[i][base] ;
			}
			var p_sample = 0 ;
			for (var i=0;i<num_samples;i++) {
				abi.data[i][base] += p_sample ;
				p_sample = abi.data[i][base] ;
			}
		} ) ;

		// Bases
		p = abi.bases_offset ;
		abi.base_data = [] ;
		for ( var base = 0 ; base < abi.bases ; base++ ) {
			abi.base_data[base] = {
				index : me.getBigEndianUnsignedLong ( bytes , p+base*4 ) ,
				prob_A : bytes[p+abi.bases*4+base] ,
				prob_C : bytes[p+abi.bases*5+base] ,
				prob_G : bytes[p+abi.bases*6+base] ,
				prob_T : bytes[p+abi.bases*7+base] ,
				base : String.fromCharCode ( bytes[p+abi.bases*8+base] )
			} ;
		}

	
	} else { // V 1.0 or 2.0
		
		// Points
		abi.data = [] ; // Raw point data
		
		var p = abi.samples_offset ;
		for ( var point = 0 ; point < abi.samples ; point++ ) {
			var o = {} ;
			if ( abi.sample_size == 1 ) { // V1; untested. Does it exist in the wild?
				o =  {
					A : bytes[p+0] ,
					C : bytes[p+1] ,
					G : bytes[p+2] ,
					T : bytes[p+3]
					} ;
			} else { // V2
				o.A = me.getBigEndianUnsignedWord ( bytes , p+0 ) ;
				o.C = me.getBigEndianUnsignedWord ( bytes , p+2 ) ;
				o.G = me.getBigEndianUnsignedWord ( bytes , p+4 ) ;
				o.T = me.getBigEndianUnsignedWord ( bytes , p+6 ) ;
			}
			abi.data[point] = o ;
			p += 4 * abi.sample_size ;
		}
		
		// Bases
		p = abi.bases_offset ;
		abi.base_data = [] ;
		for ( var base = 0 ; base < abi.bases ; base++ ) {
			abi.base_data[base] = {
				index : me.getBigEndianUnsignedLong ( bytes , p ) ,
				prob_A : bytes[p+4] ,
				prob_C : bytes[p+5] ,
				prob_G : bytes[p+6] ,
				prob_T : bytes[p+7] ,
				base : String.fromCharCode ( bytes[p+8] ) // Plus 3 blank spare
			} ;
			p += 12 ;
		}
		
	}

	// Highest peak
	abi.max_data = 0 ;
	for ( var point = 0 ; point < abi.samples ; point++ ) {
		$.each ( ['A','C','G','T'] , function ( dummy , base ) {
			if ( abi.max_data < abi.data[point][base] ) abi.max_data = abi.data[point][base] ;
		} ) ;
	}
	
	// PARSING INCOMPLETE! Private data, comments not parsed

	


	// END ABI PARSING
	
	// NOW TURNING ABI OBJECT INTO OVERSIMPLIFIED DISPLAY STRUCTURE
	
	var max = 1000 ; // abi.max_data
	var n = abi.num_version >= 3 ? 10 : 10 ;
	var tempseq = [] ;
	$.each ( abi.base_data , function ( k , v ) {
		var d = abi.data[v.index] ;
		if ( typeof d == 'undefined' ) {
			console.log ( "ABI: Index " + v.index + " undefined" ) ;
			return ;
		}
		var o = {
			A : (d.A > max ? max : d.A)/n ,
			C : (d.C > max ? max : d.C)/n  ,
			G : (d.G > max ? max : d.G)/n  ,
			T : (d.T > max ? max : d.T)/n  ,
			base : v.base
		} ;
		tempseq.push ( o ) ;
	} ) ;


	var seqtext = '';

	for (i in tempseq) {
		seqtext += tempseq[i]['base'];
	}
*/
	var name = "Chromatogram" ;
	var seq = {
		name: "Chromatogram",
		desc: '',
		is_circular: false,
		features: [], 
//		sequence: seqtext,
//		tempseq: tempseq, // Chromatogram
		scf:abi // KEEP THE FULL, PARSED DATA
	} ;
	
	return [ seq ] ;
	}

  FT_abi.prototype.parseText = function ( text ) {
    this.text = text ;
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
