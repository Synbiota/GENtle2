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

		if ( undefined === o.name ) o.name = o.type ;
		o.name = o.name.replace(/^"/,'').replace(/"$/,'') ;

		$.each ( cd.feature_types , function ( k2 , v2 ) {
			if ( v['_type'].toLowerCase() !== k2 ) return ;
			o.type = k2 ;
			if ( v2.is_main_type ) o.row = 'main' ;
		} ) ;

		if ( o.type == 'gene' ) o.row = 'top' ;
		if ( o.type == 'cds' ) o.rc = v['_range'][0].rc ;
		me.list[o.row].push ( o ) ;
	} ) ;
	
	if ( me.list.main.length == 0 ) return '' ; // No main elements, no point showing this
	
	me.list.main = me.list.main.sort ( me.sortFeaturesByPosition ) ;
	var m2 = [] ;
	if ( me.list.main[0].start > 0 ) m2.push ( { start : 1 , stop : me.list.main[0].start-1 , type : 'space' } ) ;
//	else if ( is_primary ) m2.push ( { start : 0 , stop :0 , type : 'space' } ) ;
	$.each ( me.list.main , function ( k , v ) {
		m2.push ( v ) ;
		if ( k+1 == me.list.main.length ) return ;
		m2.push ( { start : v.stop+1 , stop : me.list.main[k+1].start-1 , type : 'space' } ) ;
	} ) ;
	if ( me.list.main[me.list.main.length-1].stop < sequence.seq.length-1 ) m2.push ( { start : me.list.main[me.list.main.length-1].stop+1 , stop : sequence.seq.length , type : 'space' } ) ;
	
	if ( is_primary ) m2.push ( { start : 1 , stop : sequence.seq.length , type : 'trash' } ) ;
	else m2.push ( { start : 1 , stop : sequence.seq.length , type : 'all' } ) ;
	
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
//	if ( h += "<div style='display:none' class='designer_row_feature_droppable designer_row_feature_droppable_space'></div>" ;
	if ( is_primary ) {
		h += "<div class='designer_row_feature_droppable designer_row_feature_dummy'></div>" ;
	}
	$.each ( me.list.main , function ( k , v ) {
		var len = v.stop - v.start + 1 ;
		if ( len <= 0 ) return ;
		len = addCommas ( len ) + "&nbsp;bp" ;
		if ( v.type == 'space' ) {
			h += "<div class='designer_row_feature_space" ;
			if ( is_primary ) h += " designer_row_feature_droppable" ;
			h += "' title='Un-annotated region, " + len + "'>" ;
			h += "&nbsp;<br/>&nbsp;" ;
			h += "</div>" ;
		} else if ( v.type == 'all' ) {
			h += "<div class='designer_row_feature designer_row_feature_draggable designer_row_feature_all' title='Drag entire construct'" ;
			h += " seqnum='" + seqnum + "'" ;
			h += " nextbase='" + v.start + "'>Entire construct<br/>&Sigma;" ;
			h += "</div>" ;
		} else if ( v.type == 'trash' ) {
			h += "<div class='designer_row_feature_droppable designer_trash' title='Trash'>" ;
			h += "<b><i class='icon-trash' /></b><br/>Drop feature here to delete" ;
			h += "</div>" ;
		} else {
			if ( is_primary ) h += " <div class='designer_row_feature_droppable designer_row_feature_droppable_space' nextbase='" + v.start + "'>&nbsp;<br/>&nbsp;</div>" ;
			h += "<div class='designer_row_feature " ;
			if ( is_primary ) h += "designer_row_feature_droppable" ;
			h += " designer_row_feature_draggable" ;
			h += " designer_row_feature_" + v.type + "' title='" + cd.feature_types[v.type].name + "'" ;
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
		var nh = me.getSequenceSchemaHTML ( me.sequence , cnt , k ) ; // This happens only once...
		if ( nh != '' ) cnt++ ;
		h += nh ;
	} ) ;
	$.each ( gentle.sequences , function ( k , v ) {
		if ( v == me.sequence ) return ;
		if ( v.typeName != 'dna' ) return ;
		var nh = me.getSequenceSchemaHTML ( v , cnt , k ) ;
		if ( nh != '' ) cnt++ ;
		h += nh ;
	} ) ;
	
	if ( cnt == 0 ) h = "<div style='color:black'><i>No suitable sequences loaded.</i></div>" ;

	me.updateTitleBar() ;
	
	$('#canvas_wrapper').html ( h ) ;
	
	$('.designer_row_feature_droppable_space').hide();

	$.each ( gentle.sequences , function ( k , v ) {
		$('#designer_sequence_link'+k).click ( function () {
			if ( v == me.sequence ) {
				var seq = gentle.sequences[k].clone() ;
				seq.typeName = 'dna' ;
				seq.name += " (designed)" ;
				gentle.addSequence ( seq , true ) ;
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
			$('.designer_row_feature_dummy').hide() ;
			var source = ui.draggable ;
			if ( source.hasClass('designer_row_feature_droppable') ) $('.designer_trash').css({display:'inline-block'}) ;
		} ,
		deactivate : function (event,ui) {
			$('.designer_row_feature_dummy').show() ;
			$('.designer_row_feature_droppable_active').removeClass('designer_row_feature_droppable_active');
			$('.designer_row_feature_droppable_space').hide(); // Not very elegant, but $(this) doesn't work...
			$('.designer_trash').hide() ;
		} ,
		drop : function ( event , ui ) {
			var source = ui.draggable ;
			var target = $(this) ;
			var seqnum = source.attr('seqnum') ;
			var featnum = source.attr('featnum') ;
			$('.designer_trash').hide() ;
			if ( undefined === seqnum ) return ; // Paranoia
			if ( target.hasClass ( 'designer_row_feature_droppable_space' ) ) {

				if ( source.hasClass('designer_row_feature_all') ) {
					
					var start = 0 ;
					var stop = gentle.sequences[seqnum].seq.length ;
					var newseq = gentle.sequences[seqnum].asNewSequenceDNA ( start , stop ) ;
					if ( undefined === newseq ) return ; // Paranoia
					me.sequence.insertSequenceDNA ( newseq , next_base ) ;
					
					
				} else {
			
					if ( undefined === featnum ) return ;
					var next_base = target.attr('nextbase') ;
					var oldfeat = gentle.sequences[seqnum].features[featnum] ;
					var start = oldfeat['_range'][0].from ;
					var stop = oldfeat['_range'][oldfeat['_range'].length-1].to ;
				
				
					var newseq = gentle.sequences[seqnum].asNewSequenceDNA ( start , stop ) ;
					if ( undefined === newseq ) return ; // Paranoia
					me.sequence.insertSequenceDNA ( newseq , next_base ) ;
				}
				
				setTimeout ( function(){me.init()} , 1 ) ;
			} else {
				if ( target.hasClass('designer_trash') ) {
					var oldfeat = gentle.sequences[seqnum].features[featnum] ;
					var start = oldfeat['_range'][0].from ;
					var stop = oldfeat['_range'][oldfeat['_range'].length-1].to ;
					me.sequence.remove ( start , stop-start+1 ) ;
					setTimeout ( function(){me.init()} , 1 ) ;
				} else {
					alert ( "Drop-to-merge function not yet implemented" ) ;
				}
			}
		}
	} ) ;
	
}

function SequenceCanvasDesigner ( the_sequence , canvas_id ) {
	gentle.main_sequence_canvas = this ; // Ugly but necessary
	this.tools = {} ;
	this.type = 'designer' ;
	
	this.fixMenus() ;
	this.initSidebar() ;

	this.canvas_id = 'sequence_canvas' ;
	this.sequence = the_sequence ;
	this.init () ;
	the_sequence.undo.updateEditMenu() ;
	gentle.set_hover ( '' ) ;
}
