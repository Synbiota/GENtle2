//________________________________________________________________________________________
// SC Designer
SequenceCanvasDesigner.prototype = new SequenceCanvas() ;
SequenceCanvasDesigner.prototype.constructor = SequenceCanvasDesigner ;

SequenceCanvasDesigner.prototype.sortFeaturesByPosition = function ( a , b ) {
	return ( a.start - b.start ) ;
}


SequenceCanvasDesigner.prototype.getSequenceSchemaHTML = function ( sequence , row , seqnum ) {
	var me = this ;
	var is_primary = ( row == 0 ) ;
	
	// Generate collapsed feature list
	me.list = { top : [] , main : [] , bottom : [] } ;
	
	$.each ( sequence.features , function ( k , v ) {
		var o = {
			start : v['_range'][0].from ,
			stop : v['_range'][v['_range'].length-1].to ,
			name : v['name'] || v['gene'] || v['product'] ,
			type : 'misc' ,
			row : 'bottom' ,
			featnum : k
		} ;
		if ( v['_type'].match(/^promoter$/i) ) o.type = 'promoter' ;
		else if ( v['_type'].match(/^gene$/i) ) o.type = 'gene' ;
		else if ( v['_type'].match(/^CDS$/i) ) o.type = 'cds' ;
		if ( undefined === o.name ) o.name = o.type ;
		o.name = o.name.replace(/^"/,'').replace(/"$/,'') ;
		if ( o.type == 'promoter' || o.type == 'cds' ) o.row = 'main' ;
		else if ( o.type == 'gene' ) o.row = 'top' ;
		if ( o.type == 'cds' ) o.rc = v['_range'][0].rc ;
		me.list[o.row].push ( o ) ;
	} ) ;
	
	if ( me.list.main.length == 0 ) return '' ; // No main elements, no point showing this
	
	me.list.main = me.list.main.sort ( me.sortFeaturesByPosition ) ;
	var m2 = [] ;
	if ( me.list.main[0].start > 0 ) m2.push ( { start : 1 , stop : me.list.main[0].start-1 , type : 'space' } ) ;
	$.each ( me.list.main , function ( k , v ) {
		m2.push ( v ) ;
		if ( k+1 == me.list.main.length ) return ;
		m2.push ( { start : v.stop+1 , stop : me.list.main[k+1].start-1 , type : 'space' } ) ;
	} ) ;
	if ( me.list.main[me.list.main.length-1].stop < sequence.seq.length-1 ) m2.push ( { start : me.list.main[me.list.main.length-1].stop+1 , stop : sequence.seq.length , type : 'space' } ) ;
	me.list.main = m2 ;
	
	// Generate HTML
	var h = '' ;
	h += "<div id='designer_row" + row + "' class='designer_row" ;
	if ( is_primary ) h += " designer_row_primary" ;
	h += "'>" ;
	
	
	h += "<div class='designer_row_header'>" ;
	h += "<a href='#' id='designer_sequence_link" + seqnum + "'>" + ( sequence.name || "Unnamed" ) + "</a><br/>" ;
	h += "<small>" + addCommas ( sequence.seq.length ) + "&nbsp;bp</small>" ;
	h += "</div>" ;
	
	h += "<div class='designer_row_features'>" ;
	
	h += "<div class='designer_row_features_top'>" ;
	h += "<span style='color:#DDDDDD;font-size:8pt'>This row is for annotating genes, not yet implemented</span>" ;
	h += "</div>" ;
	
	h += "<div class='designer_row_features_main'>" ;
	$.each ( me.list.main , function ( k , v ) {
		var len = v.stop - v.start + 1 ;
		if ( len <= 0 ) return ;
		len = addCommas ( len ) + "&nbsp;bp" ;
		if ( v.type == 'space' ) {
			h += "<div class='designer_row_feature_space" ;
			if ( is_primary ) h += " designer_row_feature_droppable" ;
			h += "' title='Un-annotated region, " + len + "'>" ;
//			h += "DNA<br/>" + addCommas ( v.stop - v.start + 1 ) + "&nbsp;bp" ;
			h += "&nbsp;<br/>&nbsp;" ;
			h += "</div>" ;
		} else {
			if ( is_primary ) h += "<div class='designer_row_feature_droppable designer_row_feature_droppable_space' nextbase='" + v.start + "'>&nbsp;<br/>&nbsp;</div>" ;
			h += "<div class='designer_row_feature " ;
			if ( is_primary ) h += "designer_row_feature_droppable" ;
			else h += "designer_row_feature_draggable" ;
			h += " designer_row_feature_" + v.type + "' title='" + v.type + "'" ;
			if ( undefined !== v.featnum ) h += " seqnum='" + seqnum + "' featnum='" + v.featnum + "'" ;
			h += ">" ;
			h += v.name ;
			if ( v.type == 'cds' ) {
				h += "&nbsp;" + ( v.rc ? "&larr;" : "&rarr;" ) ;
			}
			h += "<br/>" + len ;
			h += "</div>" ;
			if ( is_primary ) h += "<div class='designer_row_feature_droppable designer_row_feature_droppable_space' nextbase='" + (v.stop+1) + "'>&nbsp;<br/>&nbsp;</div>" ;
		}
	} ) ;
	h += "</div>" ;
	
	h += "<div class='designer_row_features_bottom'>" ;
	h += "<span style='color:#DDDDDD;font-size:8pt'>This row is for misc annotation, not yet implemented</span>" ;
	h += "</div>" ;
	
	h += "</div>" ;

	
	h += "</div>" ;
	return h ;
}

SequenceCanvasDesigner.prototype.init = function () {
	var me = this ;
	var h = '' ;
	var cnt = 0 ;
	$.each ( gentle.sequences , function ( k , v ) {
		if ( v != me.sequence ) return ;
		h += me.getSequenceSchemaHTML ( me.sequence , cnt++ , k ) ; // This happens only once...
	} ) ;
	$.each ( gentle.sequences , function ( k , v ) {
		if ( v == me.sequence ) return ;
		if ( v.typeName != 'dna' ) return ;
		h += me.getSequenceSchemaHTML ( v , cnt++ , k ) ;
	} ) ;
	
	$('#canvas_wrapper').html ( h ) ;
	
	$('.designer_row_feature_droppable_space').hide();

	$.each ( gentle.sequences , function ( k , v ) {
		$('#designer_sequence_link'+k).click ( function () {
			if ( v == me.sequence ) {
				var entry = gentle.sequences.length ;
				var seq = gentle.sequences[k].clone() ;
				seq.typeName = 'dna' ;
				seq.name += " (designed)" ;
				gentle.sequences[entry] = seq ;
				$('#sb_sequences').append ( '<option value="' + entry + '">' + gentle.sequences[entry].name + '</option>' ) ;
				gentle.handleSelectSequenceEntry ( entry ) ;
			} else {
				gentle.handleSelectSequenceEntry ( k ) ;
			}
			return false ;
		} ) ;
	} ) ;

	$('.designer_row_feature_draggable').draggable ( {
		revert:'invalid' , 
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
		activate : function (event,ui) {
			$('.designer_row_feature_droppable_space').css({display:'inline-block'}); // Not very elegant, but $(this) doesn't work...
		} ,
		deactivate : function (event,ui) {
			$('.designer_row_feature_droppable_space').hide(); // Not very elegant, but $(this) doesn't work...
		} ,
		drop : function ( event , ui ) {
			var source = ui.draggable ;
			var target = $(this) ;
			var seqnum = source.attr('seqnum') ;
			var featnum = source.attr('featnum') ;
			if ( undefined === seqnum || undefined === featnum ) return ; // Paranoia
			if ( target.hasClass ( 'designer_row_feature_droppable_space' ) ) {
				var next_base = target.attr('nextbase') ;
				var oldfeat = gentle.sequences[seqnum].features[featnum] ;
				var start = oldfeat['_range'][0].from ;
				var stop = oldfeat['_range'][oldfeat['_range'].length-1].to ;
				var newseq = gentle.sequences[seqnum].asNewSequenceDNA ( start , stop ) ;
				if ( undefined === newseq ) return ; // Paranoia
				me.sequence.insertSequenceDNA ( newseq , next_base ) ;
				setTimeout ( function(){me.init()} , 1 ) ;
			} else {
				alert ( "Drop-to-merge function not yet implemented" ) ;
			}
		}
	} ) ;
	
}


function SequenceCanvasDesigner ( the_sequence , canvas_id ) {
	gentle.main_sequence_canvas = this ; // Ugly but necessary
	this.tools = {} ;
	this.type = 'designer' ;
	
	$('.canvas_tool').remove() ; // Remove all menu entries from other canvases

	this.canvas_id = 'sequence_canvas' ;
	this.sequence = the_sequence ;
	this.init () ;
	gentle.set_hover ( '' ) ;
}
