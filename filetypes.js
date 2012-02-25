//________________________________________________________________________________________
// Filetype base class
function Filetype () {
	this.fileTypeValidated = false ;
	this.typeName = 'none' ;
}

Filetype.prototype.checkFile = function ( f ) {
	console.log ( "Filetype.checkFile should never be called!" ) ;
}

Filetype.prototype.parseFile = function () {
	console.log ( "Filetype.parseFile should never be called!" ) ;
}

Filetype.prototype.parseText = function () {
	console.log ( "Filetype.parseText should never be called!" ) ;
}

Filetype.prototype.getFileExtension = function () {
	return '' ;
}


//________________________________________________________________________________________
// Plain text
FT_plaintext.prototype = new Filetype() ;
FT_plaintext.prototype.constructor = FT_plaintext ;

FT_plaintext.prototype.getFileExtension = function () {
	return 'txt' ;
}

FT_plaintext.prototype.getExportBlob = function ( sequence ) {
	var ret = { error : false } ;
	ret.blob = getBlobBuilder() ;
	if ( undefined === ret.blob ) return { error : true } ; // Paranoia
	
	var s = sequence.seq ;
	while ( s != '' ) {
		ret.blob.append ( s.substr ( 0 , 60 ) + "\n" ) ;
		s = s.substr ( 60 , s.length-60 ) ;
	}
	
	ret.filetype = "text/plain;charset=utf-8" ;
	
	return ret ;
}

FT_plaintext.prototype.parseFile = function () {
	var seqtext = ucFirst ( this.text.replace ( /[^a-z]/gi , '' ) ) ;
	var v = new SequenceDNA ( this.file.name , seqtext ) ;
	var seqid = gentle.sequences.length ;
	gentle.sequences.push ( v ) ;
	$('#sb_sequences').append ( '<option value="' + seqid + '">' + v.name + '</option>' ) ;
//	$('#sb_log').append ( '<p>Loaded ' + v.seq.length + ' bp :<br/>' + v.name + '</p>' ) ;
	if ( gentle.sequences.length == 1 ) {
		$('#sb_sequences').val(seqid) ;
		gentle.handleSelectSequenceEntry ( seqid ) ;
	}
}

FT_plaintext.prototype.checkFile = function ( f ) {
	this.file = f ;
	var reader = new FileReader();
	var meh = this ;

	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			if ( f.isIdentified ) return ;
			meh.text = e.target.result ;
			if ( meh.text.match ( /[^a-zA-Z0-0\s]/ ) ) return ; // Return if other than alphanum chars
			f.isIdentified = true ;
			meh.fileTypeValidated = true ;
			gentle.fileLoaded ( meh ) ;
			meh.parseFile () ;
		};
	})(f);
	
	// Read in the image file as a data URL.
	reader.readAsText(f);
}

function FT_plaintext () {
	this.typeName = 'plaintext' ;
}

//________________________________________________________________________________________
// FASTA
FT_fasta.prototype = new Filetype() ;
FT_fasta.prototype.constructor = FT_fasta ;

FT_fasta.prototype.getFileExtension = function () {
	return 'fasta' ;
}

FT_fasta.prototype.getExportBlob = function ( sequence ) {
	var ret = { error : false } ;
	ret.blob = getBlobBuilder() ;
	if ( undefined === ret.blob ) return { error : true } ; // Paranoia
	
	ret.blob.append ( ">" + sequence.name + "\n" ) ;
	var s = sequence.seq ;
	while ( s != '' ) {
		ret.blob.append ( s.substr ( 0 , 60 ) + "\n" ) ;
		s = s.substr ( 60 , s.length-60 ) ;
	}
	
	ret.filetype = "text/plain;charset=utf-8" ;
	
	return ret ;
}

FT_fasta.prototype.parseFile = function () {
	var lines = this.text.replace(/\r/g,'').split ( "\n" ) ;
	var name = '' ;
	var seq = '' ;
	var tempseq = [] ;
	$.each ( lines , function ( k , v ) {
		if ( v.match ( /^>/ ) ) {
			if ( seq != '' ) tempseq.push ( new SequenceDNA ( name , seq ) ) ;
			name = v.replace ( /^>\s*/ , '' ) ;
			seq = '' ;
		} else {
			seq += v.replace ( /\s/g , '' ).toUpperCase() ;
		}
	} ) ;
	if ( seq != '' ) tempseq.push ( new SequenceDNA ( name , seq ) ) ;
	
	$.each ( tempseq , function ( k , v ) {
		var seqid = gentle.sequences.length ;
		gentle.sequences.push ( v ) ;
		$('#sb_sequences').append ( '<option value="' + seqid + '">' + v.name + '</option>' ) ;
//		$('#sb_log').append ( '<p>Loaded ' + v.seq.length + ' bp :<br/>' + v.name + '</p>' ) ;
		if ( gentle.sequences.length == 1 ) {
			$('#sb_sequences').val(seqid) ;
			gentle.handleSelectSequenceEntry ( seqid ) ;
		}
	} ) ;
}

FT_fasta.prototype.checkFile =function ( f ) {
	this.file = f ;
	var reader = new FileReader();
	var meh = this ;
	
	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			if ( f.isIdentified ) return ;
			meh.text = e.target.result ;
			if ( meh.text.match ( /^\>/ ) ) {
				f.isIdentified = true ;
				meh.fileTypeValidated = true ;
				gentle.fileLoaded ( meh ) ;
				meh.parseFile () ;
			}
		};
	})(f);
	
	// Read in the image file as a data URL.
	reader.readAsText(f);
}

function FT_fasta () {
	this.typeName = 'FASTA' ;
}




//________________________________________________________________________________________
// GeneBank
FT_genebank.prototype = new Filetype() ;
FT_genebank.prototype.constructor = FT_genebank ;

FT_genebank.prototype.checkFile =function ( f ) {
	this.file = f ;
	var reader = new FileReader();
	var meh = this ;
	
	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			if ( f.isIdentified ) return ;
			meh.text = e.target.result ;
			if ( meh.text.match ( /^LOCUS\s+/i ) ) {
				f.isIdentified = true ;
				meh.fileTypeValidated = true ;
				gentle.fileLoaded ( meh ) ;
				meh.parseFile () ;
			}
		};
	})(f);
	
	// Read in the image file as a data URL.
	reader.readAsText(f);
}

FT_genebank.prototype.parseText = function ( text ) {
	this.text = text ;
	this.fileTypeValidated = true ;
//	$('#sb_log').append ( '<p>GenBank text loaded</p>' ) ;
	this.parseFile () ;
}

FT_genebank.prototype.parseFile = function () {
	var lines = this.text.replace(/\r/g,'').split ( "\n" ) ;

	var mode = '' ;
	var seq = new SequenceDNA ( '' , '' ) ;
	var feature = {} ;
	$.each ( lines , function ( k , v ) {

		if ( v.match(/^LOCUS/i) ) {
			var m = v.match(/^LOCUS\s+(\S+)\s+(.+)$/i)
			seq.name = m[1] ;
			seq.is_circular = m[2].match(/\bcircular\b/i) ? true : false ;
			return ;
		} else if ( v.match(/^DEFINITION\s+(.+)$/i) ) {
			var m = v.match(/^DEFINITION\s+(.+)$/i) ;
			seq.name = m[1] ;
		} else if ( v.match(/^FEATURES/i) ) {
			mode = 'FEATURES' ;
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
				feature = {} ;
				feature['_type'] = m[1] ;
				feature['_range'] = m[2] ;
				feature['_last'] = '_range' ;
				return ;
			}
			
			m = v.match ( /^\s{8,21}\/(\w+)\s*=\s*(.+)\s*$/ ) ;
			if ( m ) { // Begin new tag
				m[1] = m[1].replace ( /^"/ , '' ) ;
				feature['_last'] = m[1] 
				feature[m[1]] = m[2] ;
				return ;
			}
			
			m = v.match ( /^\s{18,21}\s*(.+)\s*$/ ) ;
			if ( m ) { // Extend tag
				//if ( null !== feature[feature['_last']].match(/^[A-Z]+$/) )
				m[1] = m[1].replace ( /"$/ , '' ) ;
				if ( m[1].match(/^[A-Z]+$/) === null ) feature[feature['_last']] += " " ;
				feature[feature['_last']] += m[1] ;
			}
		
		} else if ( mode == 'ORIGIN' ) {
		
			if ( v.match(/^\/\//) ) return false ; // The absolute end
			seq.seq += v.replace ( /[ 0-9]/g , '' ).toUpperCase() ;
			
		}
	} ) ;
	
	// Cleanup features
	$.each ( seq.features , function ( k , v ) {
		delete v['_last'] ;
		var range = [] ; // Default : Unknown = empty TODO FIXME
		var r = v['_range'] ;
		
		var m = r.match ( /^\d+$/ ) ;
		if ( m ) {
			range.push ( { from : r*1 , to : r*1 , rc : false } ) ;
			v['_range'] = range ;
			return ;
		}
		
		m = r.match ( /^(\d+)\.\.(\d+)$/ ) ;
		if ( m ) {
			range.push ( { from : m[1]*1 , to : m[2]*1 , rc : false } ) ;
			v['_range'] = range ;
			return ;
		}
		
		m = r.match ( /^complement\((\d+)\.\.(\d+)\)$/i ) ;
		if ( m ) {
			range.push ( { from : m[1]*1 , to : m[2]*1 , rc : true } ) ;
			v['_range'] = range ;
			return ;
		}
		
		console.log ( "Could not parse range " + r ) ;
		v['_range'] = range ;
	} ) ;
	
	var seqid = gentle.sequences.length ;
	gentle.sequences.push ( seq ) ;
	$('#sb_sequences').append ( '<option value="' + seqid + '">' + seq.name + '</option>' ) ;
//	$('#sb_log').append ( '<p>Loaded ' + seq.seq.length + ' bp :<br/>' + seq.name + '</p>' ) ;
	$('#sb_sequences').val(seqid) ;
	gentle.handleSelectSequenceEntry ( seqid ) ;
}


function FT_genebank () {
	this.typeName = 'GeneBank' ;
}
