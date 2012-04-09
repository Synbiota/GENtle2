//________________________________________________________________________________________
// Sequence base class
function Sequence ( name , seq ) {
	this.seq = seq ;
	this.typeName = 'none' ;
	this.name = 'Unnamed' ;
	this.features = new Array() ;
}

Sequence.prototype.insert = function ( base , text ) {}
Sequence.prototype.remove = function ( base , len ) {}
Sequence.prototype.clone = function () {}



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

SequenceDNA.prototype.asNewSequenceDNA = function ( start , stop ) {
	var me = this ;
	var ret = new SequenceDNA ( me.name , me.seq.substr ( start , stop-start+1 ) ) ;
	$.each ( me.features , function ( k , v ) {
		if ( v['_range'][0].from > stop ) return ;
		if ( v['_range'][v['_range'].length-1].to < start ) return ;
		var o = clone ( v ) ;
		o['_range'] = [] ;
		$.each ( v['_range'] , function ( k2 , v2 ) {
			if ( v2.from > stop || v2.to < start ) return ;
			var o2 = clone ( v2 ) ;
			o2.from -= start ;
			o2.to -= start ;
			o['_range'].push ( o2 ) ;
		} ) ;
		ret.features.push ( o ) ;
	} ) ;
	return ret ;
}

SequenceDNA.prototype.insertSequenceDNA = function ( newseq , pos ) {
	var me = this ;
	pos *= 1 ; // Force int
	me.insert ( pos , newseq.seq ) ;
	$.each ( newseq.features , function ( k , v ) {
		var o = clone ( v ) ;
		var add_desc = "Was part of \"" + (newseq.name||'') + "\"" ;
		if ( o.desc === undefined || o.desc == '' ) o.desc = add_desc ;
		else o.desc += "\n" + add_desc ;
		$.each ( o['_range'] , function ( k2 , v2 ) {
			v2.from = v2.from * 1 + pos ;
			v2.to = v2.to * 1 + pos ;
		} ) ;
		me.features.push ( o ) ;
	} ) ;
}

SequenceDNA.prototype.clone = function () {
	var me = this ;
	var ret = new SequenceDNA ( me.name , me.seq ) ;
	
	$.each ( ['desc','typeName','features'] , function ( k , v ) {
		if ( undefined === me[v] ) return ;
		ret[v] = clone(me[v]) ;
	} ) ;
	
	
	return ret ;
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
