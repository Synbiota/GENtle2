//________________________________________________________________________________________
// SC Designer
SequenceCanvasDesigner.prototype = new SequenceCanvas() ;
SequenceCanvasDesigner.prototype.constructor = SequenceCanvasDesigner ;

SequenceCanvasDesigner.prototype.sortFeaturesByPosition = function ( a , b ) {
	return ( a.start - b.start ) ;
}


SequenceCanvasDesigner.prototype.getSequenceSchemaHTML = function ( sequence , row ) {
	var me = this ;
	var is_primary = ( row == 0 ) ;
	
	// Generate collapsed feature list
	me.list = { top : [] , main : [] , bottom : [] } ;
	
	$.each ( sequence.features , function ( k , v ) {
		var o = {
			start : v['_range'][0].from ,
			stop : v['_range'][v['_range'].length-1].to ,
			name : v['name'] || v['gene'] || v['product'] || "??" ,
			type : 'misc' ,
			row : 'bottom'
		} ;
		o.name = o.name.replace(/^"/,'').replace(/"$/,'') ;
		if ( v['_type'].match(/^promoter$/i) ) o.type = 'promoter' ;
		else if ( v['_type'].match(/^gene$/i) ) o.type = 'gene' ;
		else if ( v['_type'].match(/^CDS$/i) ) o.type = 'cds' ;
		if ( o.type == 'promoter' || o.type == 'cds' ) o.row = 'main' ;
		else if ( o.type == 'gene' ) o.row = 'top' ;
		me.list[o.row].push ( o ) ;
	} ) ;
	
	
	me.list.main = me.list.main.sort ( me.sortFeaturesByPosition ) ;
	var m2 = [] ;
	$.each ( me.list.main , function ( k , v ) {
		m2.push ( v ) ;
		if ( k+1 == me.list.main.length ) return ;
		m2.push ( { start : v.stop+1 , stop : me.list.main[k+1].start-1 , type : 'space' } ) ;
	} ) ;
	me.list.main = m2 ;
	
	// Generate HTML
	var h = '' ;
	h += "<div id='designer_row" + row + "' class='designer_row" ;
	if ( is_primary ) h += " designer_row_primary" ;
	h += "'>" ;
	
	
	h += "<div class='designer_row_header'>" ;
	h += ( sequence.name || "Unnamed" ) + "<br/>" ;
	h += "<small>" + addCommas ( sequence.seq.length ) + "&nbsp;bp</small>" ;
	h += "</div>" ;
	
	h += "<div class='designer_row_features'>" ;
	
	h += "<div class='designer_row_features_top'>" ;
	h += "</div>" ;
	
	h += "<div class='designer_row_features_main'>" ;
	$.each ( me.list.main , function ( k , v ) {
		if ( v.type == 'space' ) {
			h += "<div class='designer_row_feature_space' title='Un-annotated region'>" ;
			h += "<br/><i>acgt</i>" ;
			h += "</div>" ;
		} else {
			if ( is_primary ) h += "<div class='designer_row_feature_droppable designer_row_feature_droppable_space' before='" + v.start + "'></div>" ;
			h += "<div class='designer_row_feature " ;
			if ( is_primary ) h += "designer_row_feature_droppable" ;
			else h += "designer_row_feature_draggable" ;
			h += " designer_row_feature_" + v.type + "' title='" + v.type + "'>" ;
			h += v.name + "<br/>" + addCommas ( v.stop - v.start + 1 ) + "&nbsp;bp" ;
			h += "</div>" ;
			if ( is_primary ) h += "<div class='designer_row_feature_droppable designer_row_feature_droppable_space' after='" + v.stop + "'></div>" ;
		}
	} ) ;
	h += "</div>" ;
	
	h += "<div class='designer_row_features_bottom'>" ;
	h += "</div>" ;
	
	h += "</div>" ;

	
	h += "</div>" ;
	return h ;
}

SequenceCanvasDesigner.prototype.init = function () {
	var me = this ;
	var h = '' ;
	var cnt = 0 ;
	h += me.getSequenceSchemaHTML ( me.sequence , cnt++ ) ;
	$.each ( gentle.sequences , function ( k , v ) {
		if ( v == me.sequence ) return ;
		h += me.getSequenceSchemaHTML ( v , cnt++ ) ;
	} ) ;
	
	$('#canvas_wrapper').html ( h ) ;

	$('.designer_row_feature_draggable').draggable ( {
		revert:true , 
		appendTo:'body', 
		containment:'document' , 
		helper:'clone' , 
		scroll:false , 
		opacity: 0.35 ,
		zIndex:2700
	} ) ;
	
	$('.designer_row_feature_droppable').droppable ( {
		accept:'.designer_row_feature_draggable' ,
		activeClass:'designer_row_feature_droppable_active' ,
		hoverClass:'designer_row_feature_droppable_active_hover' ,
		tolerance:'pointer',
		drop : function ( event , ui ) {
			var source = ui.draggable ;
			var target = $(this) ;
			if ( target.hasClass ( 'designer_row_feature_droppable_space' ) ) {
				var before = target.attr('before') ;
				var after = target.attr('after') ;
				console.log ( before + " / " + after ) ;
			} else {
			}
		}
	} ) ;
	
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
