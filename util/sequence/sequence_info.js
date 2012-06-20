//________________________________________________________________________________________
// SequenceInfoDialog base class
function SequenceInfoDialog ( sc ) {
}

SequenceInfoDialog.prototype.onCancelButton = function () {}
SequenceInfoDialog.prototype.onSaveButton = function () {}

SequenceInfoDialog.prototype.closeDialog = function () {
	$('#'+gentle.sequence_info_dialog.sid).modal('hide');
	$('#'+gentle.sequence_info_dialog.sid).remove();
	return false ;
}


//________________________________________________________________________________________
// SID DNA
SequenceInfoDialogDNA.prototype = new SequenceInfoDialog() ;
SequenceInfoDialogDNA.prototype.constructor = SequenceInfoDialogDNA ;

function SequenceInfoDialogDNA ( sc ) {
	this.sc = sc ;
	this.sid = 'sequence_info_dialog_dna' ;
	

	// TODO populate in-dialog data copy of sc
	this.data = {} ;
	this.data.name = sc.sequence.name || '' ;
	this.data.desc = sc.sequence.desc || '' ;
	
	
	$('#'+this.sid).remove();
	var dialogContainer = $("<div/>");
	dialogContainer.load ( "public/templates/sequence_info_dialog_dna.html", function() {
		var me = gentle.sequence_info_dialog ;
		gentle.is_in_dialog = true ;
		
		sc.unbindKeyboard() ;
		dialogContainer.appendTo("#all");
		$('#'+me.sid).modal();
		
		$('#'+me.sid).on('hidden', function () {
			gentle.is_in_dialog = false ;
			sc.bindKeyboard() ;
		}) ;
		
		// TODO initialize display
		$('#sid_name').val ( me.data.name ) ;
		$('#sid_desc').val ( me.data.desc ) ;
		
		var h = '' ;
		me.features = clone ( me.sc.sequence.features ) ;
		$.each ( me.features , function ( k , v ) {
			var type = v['_type'] || 'unknown' ;
			if ( type == 'source' ) return ;
			
			var from = v['_range'][0].from ;
			var to = v['_range'][v['_range'].length-1].to ;
			var rc = v['_range'][0].rc ? "&larr;" : "&rarr;" ;

			// The name and desc finding is code duplication, and should be factorized!
			var name = '' ;
			if ( v['gene'] !== undefined ) name = v['gene'] ;
			else if ( v['product'] !== undefined ) name = v['product'] ;
			else if ( v['name'] !== undefined ) name = v['name'] ;
			name = name.replace(/^"/,'').replace(/"$/,'') ;

			h += "<tr rowid='" + k + "'>" ;
			h += "<td style='width:100%'>" + name + "</td>" ;
			h += "<td nowrap>" + type + "</td>" ;
			h += "<td nowrap>" + from + " &ndash; " + to + " " + rc + "</td>" ;
			h += "<td><button class='btn btn-danger' onclick='gentle.sequence_info_dialog.deleteAnnotation("+k+");return false'>Delete</button></td>" ;
			h += "</tr>" ;
		} ) ;
		$('#sid_annotation_tbody').html ( h ) ;
/*		$('#sid_annotation_tbody tr').click ( function ( o ) {
			gentle.sequence_info_dialog.showAnnotationDetails ( $(o.currentTarget).attr('rowid') ) ;
		} ) ;*/
		
		$('#sid_tab').tab('show') ;
		$('#sid_tab a:first').tab('show')
	} ) ;
}

SequenceInfoDialogDNA.prototype.deleteAnnotation = function ( id ) {
	var me = gentle.sequence_info_dialog ;
	me.features.splice ( id , 1 ) ; // TODO only do on local copy, only commit onSaveButton
	$('#sid_annotation_tbody [rowid='+id+']').remove() ;
	return false ;
} ;

SequenceInfoDialogDNA.prototype.showAnnotationDetails = function ( key ) {
	$("#sid_annotation_details").html ( "TODO! " + key ) ;
} ;

SequenceInfoDialogDNA.prototype.onCancelButton = function () {
	var me = gentle.sequence_info_dialog ;
	return me.closeDialog() ;
}

SequenceInfoDialogDNA.prototype.onSaveButton = function () {
	var me = gentle.sequence_info_dialog ;
	
	me.sc.sequence.name = $('#sid_name').val() ;
	me.sc.sequence.desc = $('#sid_desc').val() ;
	me.sc.sequence.features = clone ( me.features ) ;

	me.sc.recalc() ;
	me.sc.show () ;
	top_display.init() ;
	
	gentle.updateSequenceList() ;
	
	return me.closeDialog() ;
}
