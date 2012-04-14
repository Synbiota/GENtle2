//________________________________________________________________________________________
// Undo element class
function SequenceUndoElement ( event_name , data ) {
	this.event_name = event_name ;
	this.editing = data.editing || false ; // Boolean for grouping typed text into single element
	this.label = data.label || 'last action' ; // Generic fallback description
	
	var sc = gentle.main_sequence_canvas ;
	if ( undefined !== sc ) {
		data.selections = clone ( sc.selections ) ;
		data.edit = { editing : sc.edit.editing , base : sc.edit.base } ;
	}
	
	this.data = [ data ] ;
}


//________________________________________________________________________________________
// Undo/redo class
function SequenceUndo ( seq ) {
	this.elements = [] ;
	this.undo_position = 0 ;
	this.prevent_recording = false ;
	this.setSequence ( seq ) ;
}

SequenceUndo.prototype.setSequence = function ( seq ) {
	this.sequence = seq ;
}

SequenceUndo.prototype.addAction = function ( event_name , data ) {
	var me = this ;
	if ( me.prevent_recording ) return ; // Currently un-/redoing something, don't record
//	console.log ( "Adding : " + action ) ;
//	console.log ( data ) ;
	
	if ( data.editing && me.elements.length > 0 && me.elements[me.elements.length-1].editing && event_name == me.elements[me.elements.length-1].event_name ) {
//		console.log ( "Grouping edit data" ) ;
		me.elements[me.elements.length-1].data.push ( data ) ; // Group editing elements together
	} else {
		this.cancelEditing() ; // Paranoia
		me.elements.push ( new SequenceUndoElement ( event_name , data ) ) ;
	}
	
	me.undo_position = me.elements.length ;
	me.updateEditMenu() ;
}


SequenceUndo.prototype.cancelEditing = function () {
	var me = this ;
	if ( me.elements.length > 0 ) me.elements[me.elements.length-1].editing = false ;
}


SequenceUndo.prototype.updateEditMenu = function () {
	var me = this ;
	
	if ( me.undo_position > 0 ) {
		$('#undo_action').html ( me.elements[me.undo_position-1].label ) ;
	} else {
		$('#undo_action').html ( '' ) ;
	}

	if ( me.undo_position < me.elements.length ) {
		$('#redo_action').html ( me.elements[me.undo_position].label ) ;
	} else {
		$('#redo_action').html ( '' ) ;
	}
	
	gentle.setMenuState ( 'edit_menu_undo' , me.undo_position > 0 ) ;
	gentle.setMenuState ( 'edit_menu_redo' , me.undo_position < me.elements.length ) ;
}

SequenceUndo.prototype.doUndo = function ( sc ) {
	var me = this ;
//	console.log ( "This is my undoing!" ) ;
	if ( me.undo_position == 0 ) return ; // Noting to (un)do
	var e = me.elements[me.undo_position-1] ;
	me.prevent_recording = true ;
	me.undo_position-- ;
	for ( var i = e.data.length-1 ; i >= 0 ; i-- ) {
		var d = e.data[i] ;
//		console.log ( d ) ;
		if ( d.action == 'removeText' ) {
			me.sequence.insert ( d.base , d.seq , true ) ;
		} else if ( d.action == 'insertText' ) {
			me.sequence.remove ( d.base , d.seq.length , true ) ;
		} else if ( d.action == 'alterFeatureSize' ) {
			me.sequence.features[d.id]['_range'][d.range_id].from = d.before[0] ;
			me.sequence.features[d.id]['_range'][d.range_id].to = d.before[1] ;
		} else {
			console.log ( "UNKNOWN UNDO ACTION : " + d.action + " WITH THIS DATA:" ) ;
			console.log ( d ) ;
		}
		sc.selections = clone ( d.selections ) || sc.selections ;
		sc.edit = clone ( d.edit ) || sc.edit ;
	}
	sc.recalc() ;
	sc.show() ;
	me.updateEditMenu () ;
	me.prevent_recording = false ;
}

SequenceUndo.prototype.doRedo = function ( sc ) {
	var me = this ;
	alert ( "Redo not implemented yet" ) ;
}
