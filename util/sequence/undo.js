//________________________________________________________________________________________
// Undo element class
function SequenceUndoElement ( action , data ) {
	this.action = action ;
	this.editing = data.editing || false ; // Boolean for grouping typed text into single element
	this.data = [ data ] ;
}


//________________________________________________________________________________________
// Undo/redo class
function SequenceUndo ( seq ) {
	this.setSequence ( seq ) ;
	this.elements = [] ;
}

SequenceUndo.prototype.setSequence = function ( seq ) {
	this.sequence = seq ;
}

SequenceUndo.prototype.addAction = function ( action , data ) {
	var me = this ;
	console.log ( "Adding : " + action ) ;
	console.log ( data ) ;
	
	if ( data.editing && me.elements.length > 0 && me.elements[me.elements.length-1].editing && action == me.elements[me.elements.length-1].action ) {
		console.log ( "Grouping edit data" ) ;
		me.elements[me.elements.length-1].data.push ( data ) ; // Group editing elements together
	} else {
		this.cancelEditing() ; // Paranoia
		me.elements.push ( new SequenceUndoElement ( action , data ) ) ;
	}
}


SequenceUndo.prototype.cancelEditing = function () {
	var me = this ;
	if ( me.elements.length > 0 ) me.elements[me.elements.length-1].editing = false ;
}
