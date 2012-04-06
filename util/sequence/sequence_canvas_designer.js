//________________________________________________________________________________________
// SC DNA
SequenceCanvasDesigner.prototype = new SequenceCanvas() ;
SequenceCanvasDesigner.prototype.constructor = SequenceCanvasDesigner ;

SequenceCanvasDesigner.prototype.init = function () {
}


function SequenceCanvasDesigner ( the_sequence , canvas_id ) {
	gentle.main_sequence_canvas = this ; // Ugly but necessary
	this.tools = {} ;
	this.type = 'designer' ;
	
	$('.canvas_tool').remove() ; // Remove all menu entries from other canvases
/*	
	var settings = the_sequence.settings ;
	if ( settings === undefined ) settings = {
	} ;
	this.applySettings ( settings ) ;
*/	

	this.canvas_id = 'sequence_canvas' ;
	this.sequence = the_sequence ;
	this.init () ;
	
}
