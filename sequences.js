//________________________________________________________________________________________
// Sequence base class
function Sequence ( name , seq ) {
	this.seq = seq ;
	this.typeName = 'none' ;
	this.name = 'Unnamed' ;
	this.features = new Array() ;
}

Sequence.prototype.insert = function ( base , text ) {
}

Sequence.prototype.remove = function ( base , len ) {
}

//________________________________________________________________________________________
// SequenceDNA
SequenceDNA.prototype = new Sequence() ;
SequenceDNA.prototype.constructor = SequenceDNA ;

SequenceDNA.prototype.remove = function ( base , len ) {
	// TODO : Undo log
	var me = this ;
	me.seq = me.seq.substr ( 0 , base ) + me.seq.substr ( base + len , me.seq.length - base - len ) ;
	$.each ( me.features , function ( fid , f ) {
		if ( undefined === f['_range'] ) return ;
		$.each ( f['_range'] , function ( k , v ) {
			if ( v.from >= base ) v.from -= len ;
			if ( v.to+1 >= base ) v.to -= len ;
			// TODO : Remove element if non-existant
		} ) ;
	} ) ;
}

SequenceDNA.prototype.insert = function ( base , text ) {
	// TODO : Undo log
	var me = this ;
	var l = text.length ;
	me.seq = me.seq.substr ( 0 , base ) + text + me.seq.substr ( base , me.seq.length - base ) ;
	$.each ( me.features , function ( fid , f ) {
		if ( undefined === f['_range'] ) return ;
		$.each ( f['_range'] , function ( k , v ) {
			if ( v.from >= base ) v.from += l ;
			if ( v.to >= base ) v.to += l ;
		} ) ;
	} ) ;
}

function SequenceDNA ( name , seq ) {
	this.seq = seq ;
	this.name = name ;
	this.typeName = 'dna' ;
	this.features = new Array() ;
	this.edit_allowed = [] ;
	var me = this ;
	$.each ( cd.bases2iupac , function ( k , v ) {
		me.edit_allowed.push ( v ) ;
	} ) ;
}
