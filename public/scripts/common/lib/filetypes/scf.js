//________________________________________________________________________________________
// SCF
// See file type doc here: http://staden.sourceforge.net/manual/formats_unix_3.html#SEC3
// For V3.1 RfC, see http://staden.sourceforge.net/scf-rfc.html

import FT_base from './base';

var FT_scf = function() {
  this.typeName = 'SCF' ;
  this.read_binary = true ;
  this.binary = true ;
};


FT_scf.prototype = new FT_base() ;


/**
  Implements a scf file reader/writer.
  @class FT_scf
  @extends Filetype
*/
FT_scf.prototype.constructor = FT_scf ;


FT_scf.prototype.getBigEndianUnsignedWord = function ( bytes , p ) {
	var n1 = bytes[p+0] * 256 + bytes[p+1] ;
	return n1 ;
};


FT_scf.prototype.getBigEndianSignedWord = function ( bytes , p ) {
	var x = bytes[p+0] * 256 + bytes[p+1] ;
	return x >= 32768 ? x-65536 : x ;
};


FT_scf.prototype.getBigEndianUnsignedLong = function ( bytes , p ) {
	var n1 = bytes[p+0] *256*256*256 + bytes[p+1] *256*256 + bytes[p+2] * 256 + bytes[p+3] ;
	return n1 ;
};


FT_scf.prototype.getFileExtension = function () {
  return 'scf' ;
};


FT_scf.prototype.getExportString = function ( sequence ) {
  return 'NOT IMPLEMENTED YET';
};


FT_scf.prototype.parseFile = function ( just_check_format ) {
	var me = this ;

	// START SCF PARSING HERE

	var text_array = me.asArrayBuffer() ;
	if ( typeof text_array == 'undefined' ) return false ;
  //	var me_text = String.fromCharCode.apply(null, new Uint16Array(text_array)) ;
	var bytes = new Uint8Array(text_array);


	// HEADER
	var p = 0 ;
	var scf = {} ;
	scf.magic_number = String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) ;

	if ( scf.magic_number != '.scf' ) return false ;
	if ( just_check_format ) return true ;

	scf.samples = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ; // Number of raw data points
	scf.samples_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.bases = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.bases_left_clip = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.bases_right_clip = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.bases_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.comments_size = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.comments_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;

	scf.version = String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) +
					String.fromCharCode ( bytes[p++] ) ;
	scf.num_version = scf.version * 1 ;

	scf.sample_size = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ; // 2=two bytes
	scf.code_set = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.private_size = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	scf.private_offset = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;

	for ( var i = 0 ; i < 18 ; i++ ) {
		var dummy = me.getBigEndianUnsignedLong ( bytes , p ) ; p += 4 ;
	}


	if ( scf.num_version >= 3 ) { // V 3.0 and above

		var bytesize = scf.num_version == 1 ? 1 : 2 ;
		scf.data = [] ; // Raw point data
		var p = scf.samples_offset ;
		var chunksize = scf.sample_size * scf.samples ; // Offsets for C, G, T
		for ( var point = 0 ; point < scf.samples ; point++ ) {
			var o = {
				A : me.getBigEndianSignedWord ( bytes , p+chunksize*0 ) ,
				C : me.getBigEndianSignedWord ( bytes , p+chunksize*1 ) ,
				G : me.getBigEndianSignedWord ( bytes , p+chunksize*2 ) ,
				T : me.getBigEndianSignedWord ( bytes , p+chunksize*3 )
			} ;
			scf.data[point] = o ;
			p += scf.sample_size ;
		}

		// Applying diff
		var num_samples = scf.samples ;
		$.each ( ['A','C','G','T'] , function ( dummy , base ) {
			var p_sample = 0 ;
			for (let i=0;i<num_samples;i++) {
				scf.data[i][base] += p_sample ;
				p_sample = scf.data[i][base] ;
			}
			p_sample = 0 ;
		  for (let i=0;i<num_samples;i++) {
				scf.data[i][base] += p_sample ;
				p_sample = scf.data[i][base] ;
			}
		} ) ;

		// Bases
		p = scf.bases_offset ;
		scf.base_data = [] ;
		for ( var base = 0 ; base < scf.bases ; base++ ) {
			scf.base_data[base] = {
				index : me.getBigEndianUnsignedLong ( bytes , p+base*4 ) ,
				prob_A : bytes[p+scf.bases*4+base] ,
				prob_C : bytes[p+scf.bases*5+base] ,
				prob_G : bytes[p+scf.bases*6+base] ,
				prob_T : bytes[p+scf.bases*7+base] ,
				base : String.fromCharCode ( bytes[p+scf.bases*8+base] )
			} ;
		}


	} else { // V 1.0 or 2.0

		// Points
		scf.data = [] ; // Raw point data

		var p = scf.samples_offset ;
		for ( var point = 0 ; point < scf.samples ; point++ ) {
			var o = {} ;
			if ( scf.sample_size == 1 ) { // V1; untested. Does it exist in the wild?
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
			scf.data[point] = o ;
			p += 4 * scf.sample_size ;
		}

		// Bases
		p = scf.bases_offset ;
		scf.base_data = [] ;
		for ( var base = 0 ; base < scf.bases ; base++ ) {
			scf.base_data[base] = {
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
	scf.max_data = 0 ;
	for ( var point = 0 ; point < scf.samples ; point++ ) {
		$.each ( ['A','C','G','T'] , function ( dummy , base ) {
			if ( scf.max_data < scf.data[point][base] ) scf.max_data = scf.data[point][base] ;
		} ) ;
	}

	// PARSING INCOMPLETE! Private data, comments not parsed


	// END SCF PARSING

	// NOW TURNING SCF OBJECT INTO OVERSIMPLIFIED DISPLAY STRUCTURE

	var max = 1000 ; // scf.max_data
	var n = scf.num_version >= 3 ? 10 : 10 ;
	var tempseq = [] ;
	$.each ( scf.base_data , function ( k , v ) {
		var d = scf.data[v.index] ;
		if ( typeof d == 'undefined' ) {
			console.log ( "SCF: Index " + v.index + " undefined" ) ;
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
		seqtext += tempseq[i].base;
	}

	var name = "Chromatogram" ;
	var seq = {
		name: "Chromatogram",
		desc: '',
		is_circular: false,
		features: [],
		sequence: seqtext,
		tempseq: tempseq, // Chromatogram
		scf:scf // KEEP THE FULL, PARSED DATA
	} ;

	return [ seq ] ;
};


FT_scf.prototype.parseText = function ( text ) {
  this.text = text ;
  this.fileTypeValidated = true ;
  //  $('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
  this.parseFile () ;
};


FT_scf.prototype.textHeuristic = function () {
	var res = this.parseFile ( true ) ;
	return res ;
};

export default FT_scf;
