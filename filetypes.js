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
	seq.desc = '' ;
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
		
		} else if ( mode == 'REFERENCE' ) {
			seq.desc += v + "\n" ;
		
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
	
//	console.log ( JSON.stringify ( seq.features ) ) ;
	
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


//________________________________________________________________________________________
// SYBIL - SYnthetic Biology Interchange Language
FT_sybil.prototype = new Filetype() ;
FT_sybil.prototype.constructor = FT_sybil ;

FT_sybil.prototype.getFileExtension = function () {
	return 'sybil' ;
}

FT_sybil.prototype.getExportBlob = function ( sequence ) {
	var ret = { error : false } ;
	ret.blob = getBlobBuilder() ;
	if ( undefined === ret.blob ) return { error : true } ; // Paranoia
	
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

	ret.blob.append ( s ) ;
	ret.filetype = "text/plain;charset=utf-8" ;
	
	return ret ;
}

FT_sybil.prototype.parseFile = function () {
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
				
				console.log ( JSON.stringify ( feature ) ) ;
				
				seq.features.push ( feature ) ;
			} ) ;
			
			tempseq.push ( seq ) ;
		} ) ;
	} ) ;
	
	
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

FT_sybil.prototype.checkFile = function ( f ) {
	this.file = f ;
	var reader = new FileReader();
	var meh = this ;
	
	// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			if ( f.isIdentified ) return ;
			meh.text = e.target.result ;
			if ( meh.text.match ( /^<sybil\b/i ) ) {
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

function FT_sybil () {
	this.typeName = 'SYBIL' ;
}
