//________________________________________________________________________________________
// Sequence base class
function Sequence ( name , seq ) {
	this.data_keys = ['typeName','features'] ;
	this.seq = seq ;
	this.typeName = 'none' ;
	this.name = 'Unnamed' ;
	this.features = new Array() ;
	this.undo = new SequenceUndo ( this ) ;
}

Sequence.prototype.insert = function ( base , text , skip_feature_adjustment ) {}
Sequence.prototype.remove = function ( base , len , skip_feature_adjustment ) {}
Sequence.prototype.clone = function () {}

Sequence.prototype.seedFrom = function ( seq_obj ) {
	var me = this ;
	var keys = clone ( seq_obj.data_keys ) ;
	keys.push ( 'name' ) ;
	keys.push ( 'seq' ) ;
	$.each ( keys , function ( dummy , key ) {
		me[key] = clone ( seq_obj[key] ) ;
	} ) ;
}

Sequence.prototype.getStorageObject = function () {
	var me = this ;
	var keys = clone ( me.data_keys ) ;
	keys.push ( 'name' ) ;
	keys.push ( 'seq' ) ;
	keys.push ( 'data_keys' ) ;
	var ret = {} ;
	$.each ( keys , function ( dummy , key ) {
		ret[key] = clone ( me[key] ) ;
	} ) ;
	return ret ;
}

Sequence.prototype.getAnnotationName = function ( v ) {
	var name = '' ;
	if ( v['gene'] !== undefined ) name = v['gene'] ;
	else if ( v['product'] !== undefined ) name = v['product'] ;
	else if ( v['name'] !== undefined ) name = v['name'] ;
	name = name.replace(/^"/,'').replace(/"$/,'') ;
	return name ;
}

Sequence.prototype.getFeaturesInRange = function ( from , to ) {
	var me = this ;
	var ret = {} ;
	$.each ( me.features , function ( fid , f ) {
		if ( undefined === f['_range'] ) return ;
		if ( f['_range'].length == 0 ) return ;
		if ( to+1 < f['_range'][0].from ) return ;
		if ( from+1 > f['_range'][f['_range'].length-1].to ) return ;
		ret[fid] = f ;
	} ) ;
	return ret ;
}

//________________________________________________________________________________________
// SequenceDNA
SequenceDNA.prototype = new Sequence() ;
SequenceDNA.prototype.constructor = SequenceDNA ;

SequenceDNA.prototype.getEditingSeq = function () { return this.seq ; }
SequenceDNA.prototype.setEditingSeq = function (s) { this.seq = s ; }

SequenceDNA.prototype.remove = function ( base , len , skip_feature_adjustment ) {
	var me = this ;
	var editseq = me.getEditingSeq() ;
	me.undo.addAction ( 'editRemove' , { label : 'delete (-' + len + ')'  , editing : true , action : 'removeText' , base : base , len : len , seq : editseq.substr ( base , len ) } ) ;
	editseq = editseq.substr ( 0 , base ) + editseq.substr ( base + len , editseq.length - base - len ) ;
	me.setEditingSeq ( editseq ) ;
	if ( skip_feature_adjustment ) return ; // For undo/redo
	$.each ( me.features , function ( fid , f ) {
		if ( undefined === f['_range'] ) return ;
		$.each ( f['_range'] , function ( k , v ) {
			var ov = clone ( v ) ;
			if ( v.from >= base ) v.from -= len ;
			if ( v.to+1 >= base ) v.to -= len ;
			if ( v.from != ov.from || v.to != ov.to ) {
				me.undo.addAction ( 'editRemove' , { editing : true , action : 'alterFeatureSize' , before : [ ov.from , ov.to ] , after : [ v.from , v.to ] , id : fid , range_id : k } ) ;
			}
			// TODO : Remove element if non-existant
		} ) ;
	} ) ;
}

SequenceDNA.prototype.insert = function ( base , text , skip_feature_adjustment ) {
	var me = this ;
	me.undo.addAction ( 'editInsert' , { label : 'typed ' + text , editing : true , action : 'insertText' , base : base , seq : text } ) ;
	var l = text.length ;
	var editseq = me.getEditingSeq() ;
	editseq = editseq.substr ( 0 , base ) + text + editseq.substr ( base , editseq.length - base ) ;
	me.setEditingSeq ( editseq ) ;
	if ( skip_feature_adjustment ) return ; // For undo/redo
	$.each ( me.features , function ( fid , f ) {
		if ( undefined === f['_range'] ) return ;
		$.each ( f['_range'] , function ( k , v ) {
			var ov = clone ( v ) ;
			if ( v.from >= base ) v.from += l ;
			if ( v.to >= base ) v.to += l ;
			if ( v.from != ov.from || v.to != ov.to ) {
				me.undo.addAction ( 'editInsert' , { editing : true , action : 'alterFeatureSize' , before : [ ov.from , ov.to ] , after : [ v.from , v.to ] , id : fid , range_id : k } ) ;
			}
		} ) ;
	} ) ;
}

SequenceDNA.prototype.asNewSequenceDNA = function ( start , stop ) {
	var me = this ;
	var ret = new SequenceDNA ( me.name , me.seq.substr ( start , stop-start+1 ) ) ;
	$.each ( (me.features||[]) , function ( k , v ) {
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
	ret.undo.setSequence ( ret ) ;
	return ret ;
}

SequenceDNA.prototype.insertSequenceDNA = function ( newseq , pos ) {
	// TODO undo
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
	
	$.each ( me.data_keys , function ( k , v ) {
		if ( undefined === me[v] ) return ;
		ret[v] = clone(me[v]) ;
	} ) ;
	// TODO : clone undo? Or not?
	
	return ret ;
}


function SequenceDNA ( name , seq, spectrum ) {
	this.data_keys = ['desc','typeName','features','is_circular','settings'] ;
	this.seq = seq ;
	this.name = name ;
	this.spectrum = spectrum ;
	this.typeName = 'dna' ;
	this.features = new Array() ;
	this.edit_allowed = [] ;
	this.undo = new SequenceUndo ( this ) ;
	var me = this ;
	$.each ( cd.bases2iupac , function ( k , v ) {
		me.edit_allowed.push ( v ) ;
	} ) ;
}

//________________________________________________________________________________________
// SequenceDesigner
SequenceDesigner.prototype = new SequenceDNA() ;
SequenceDesigner.prototype.constructor = SequenceDesigner ;

function SequenceDesigner ( name , seq ) {
	this.data_keys = ['desc','typeName','features','is_circular','settings'] ;
	this.seq = seq ;
	this.name = name ;
	this.typeName = 'designer' ;
	this.features = new Array() ;
	this.edit_allowed = [] ;
	this.undo = new SequenceUndo ( this ) ;
	var me = this ;
	$.each ( cd.bases2iupac , function ( k , v ) {
		me.edit_allowed.push ( v ) ;
	} ) ;
}


//________________________________________________________________________________________
// SequencePCR
SequencePCR.prototype = new SequenceDNA() ;
SequencePCR.prototype.constructor = SequencePCR ;

/*
SequencePCR.prototype.remove = function ( base , len , skip_feature_adjustment ) {
	var me = this ;
	me.undo.addAction ( 'editRemove' , { label : 'delete (-' + len + ')'  , editing : true , action : 'removeText' , base : base , len : len , seq : me.seq.substr ( base , len ) } ) ;
	me.seq = me.seq.substr ( 0 , base ) + me.seq.substr ( base + len , me.seq.length - base - len ) ;
	if ( skip_feature_adjustment ) return ; // For undo/redo
	$.each ( me.features , function ( fid , f ) {
		if ( undefined === f['_range'] ) return ;
		$.each ( f['_range'] , function ( k , v ) {
			var ov = clone ( v ) ;
			if ( v.from >= base ) v.from -= len ;
			if ( v.to+1 >= base ) v.to -= len ;
			if ( v.from != ov.from || v.to != ov.to ) {
				me.undo.addAction ( 'editRemove' , { editing : true , action : 'alterFeatureSize' , before : [ ov.from , ov.to ] , after : [ v.from , v.to ] , id : fid , range_id : k } ) ;
			}
			// TODO : Remove element if non-existant
		} ) ;
	} ) ;
}


*/
SequencePCR.prototype.clone = function () {
	var me = this ;
	var ret = new SequencePCR ( me.name , me.seq ) ;
	
	$.each ( me.data_keys , function ( k , v ) {
		if ( undefined === me[v] ) return ;
		ret[v] = clone(me[v]) ;
	} ) ;
	// TODO : clone undo? Or not?
	
	return ret ;
}

SequencePCR.prototype.updatePCRproduct = function () {
	var me = this ;
	if ( undefined == me.seq ) return ;
	var max_run_bp = me.seq.length ;
	var start , stop ;
	$.each ( me.primers , function ( k , p ) {
		if ( p.is_rc ) {
			if ( undefined === stop || stop > p.to ) stop = p.to ;
		} else {
			if ( undefined === start || start > p.from ) start = p.from ;
		}
	} ) ;
	
	me.pcr_product = (me.seq||'').replace(/./g,' ') ;
	if ( undefined === start ) return ;
	if ( undefined === stop ) return ;
	if ( stop - start + 1 > max_run_bp ) return ;
	
	me.pcr_product_start = start ;
	me.pcr_product_stop = stop ;
	
	me.pcr_product = me.pcr_product.substr(0,start) + me.seq.substr(start,stop-start+1) + me.pcr_product.substr(stop) ;
	$.each ( me.primers , function ( k , p ) {
		if ( p.is_rc ) {
			me.pcr_product = me.pcr_product.substr(0,p.from) + rcSequence(me.primer_sequence_2.substr(p.from,p.to-p.from+1)).reverse() + me.pcr_product.substr(p.to+1) ;
		} else {
			me.pcr_product = me.pcr_product.substr(0,p.from) + me.primer_sequence_1.substr(p.from,p.to-p.from+1) + me.pcr_product.substr(p.to+1) ;
		}
	} ) ;
	
}

SequencePCR.prototype.writePrimer2sequence = function ( primer ) {
	var me = this ;
	var pf = primer.from ;
	var pt = primer.to ;
	var pl = pt - pf + 1 ;
	if ( primer.is_rc ) {
		me.primer_sequence_2 = me.primer_sequence_2.substr(0,pf) + rcSequence(me.seq.substr(pf,pl)).reverse() + me.primer_sequence_2.substr(pt+1) ;
	} else {
		me.primer_sequence_1 = me.primer_sequence_1.substr(0,pf) + me.seq.substr(pf,pl) + me.primer_sequence_1.substr(pt+1) ;
	}

	me.updatePCRproduct() ;
}

SequencePCR.prototype.addPrimer = function ( start , stop , is_rc ) {
	var primer = {
		from : start ,
		to : stop ,
		is_rc : is_rc
	} ;
	this.primers.push ( primer ) ;
	this.writePrimer2sequence ( primer ) ;
	gentle.showSequence ( gentle.current_sequence_entry ) ;
}

SequencePCR.prototype.getEditingSeq = function () {
	if ( gentle.main_sequence_canvas.edit.editing ) {
		var linetype = gentle.main_sequence_canvas.edit.line.type ;
		if ( linetype == 'primer1' ) return this.primer_sequence_1 ;
		if ( linetype == 'primer2' ) return this.primer_sequence_2 ;
	}
	return this.seq ;
}

SequencePCR.prototype.setEditingSeq = function (s) {
	if ( gentle.main_sequence_canvas.edit.editing ) {
		var linetype = gentle.main_sequence_canvas.edit.line.type ;
		if ( linetype == 'primer1' ) this.primer_sequence_1 = s ;
		else if ( linetype == 'primer2' ) this.primer_sequence_2 = s ;
		else this.seq = s ;
	} else this.seq = s ;
}

function SequencePCR ( name , seq , spectrum ) {
	var me = this ;
	me.data_keys = ['desc','typeName','features','is_circular','settings','primer_sequence_1','primer_sequence_2','primers'] ;
	me.seq = seq ;
	me.name = name ;
	me.spectrum = spectrum ;
	me.typeName = 'pcr' ;
	me.features = new Array() ;
	me.edit_allowed = [] ;
	me.undo = new SequenceUndo ( me ) ;
	me.primer_sequence_1 = (seq||'').replace(/./g,' ') ;
	me.primer_sequence_2 = (seq||'').replace(/./g,' ') ;
	me.pcr_product = (seq||'').replace(/./g,' ') ;
	me.primers = [] ;
	$.each ( cd.bases2iupac , function ( k , v ) {
		me.edit_allowed.push ( v ) ;
	} ) ;
	me.edit_allowed.push ( ' ' ) ;
	me.updatePCRproduct() ;
}
