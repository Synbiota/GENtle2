//________________________________________________________________________________________
// AnnotationEditorDialog base class
function AnnotationEditorDialog ( sc ) {
}

AnnotationEditorDialog.prototype.onCancelButton = function () {}
AnnotationEditorDialog.prototype.onSaveButton = function () {}

AnnotationEditorDialog.prototype.closeDialog = function () {
	$('#'+gentle.annotation_editor_dialog.sid).modal('hide');
	$('#'+gentle.annotation_editor_dialog.sid).remove();
	return false ;
}


//________________________________________________________________________________________
// AED DNA
AnnotationEditorDialogDNA.prototype = new AnnotationEditorDialog() ;
AnnotationEditorDialogDNA.prototype.constructor = AnnotationEditorDialogDNA ;

function AnnotationEditorDialogDNA ( sc , fid ) {
	this.fid = fid ;
	this.sc = sc ;
	this.sid = 'annotation_editor_dialog' ;
	
	var me = this ;
	var feat = sc.sequence.features[fid] ;

	// TODO populate in-dialog data copy of sc
	this.data = {} ;
	this.data.name = sc.sequence.name || '' ;
	this.data.desc = sc.sequence.desc || '' ;
	
	
	$('#'+this.sid).remove();
	var dialogContainer = $("<div/>");
	dialogContainer.load ( "public/templates/annotation_editor_dialog.html", function() {
		gentle.is_in_dialog = true ;
		
		sc.unbindKeyboard() ;
		dialogContainer.appendTo("#all");
		$('#'+me.sid).modal();
		
		$('#'+me.sid).on('hidden', function () {
			gentle.is_in_dialog = false ;
			sc.bindKeyboard() ;
		}) ;

		$.each ( ['gene','product','name'] , function ( k , v ) {
			if ( feat[v] === undefined ) return ;
			me.name_key = v ;
			return false ; // BREAK
		} ) ;

		$.each ( ['desc','note'] , function ( k , v ) {
			if ( feat[v] === undefined ) return ;
			me.desc_key = v ;
			return false ; // BREAK
		} ) ;
		
		var desc = feat['desc'] || feat['note'] || '' ;
		$('#aed_name').val ( sc.sequence.getAnnotationName ( feat ) ) ;
		$('#aed_desc').val ( desc ) ;

		$.each ( gentle.features , function ( k , v ) {
			var s = "<option value='"+k+"'" ;
			if ( k == feat['_type'] ) s += " selected" ;
			s += ">"+v+"</option>" ;
			$('#aed_type').append ( s ) ;
		} ) ;
		
		$.each ( feat['_range'] || [] , function ( k , v ) {
			var h = "<tr class='aed_range'><td>" ;
			h += "<input type='number' class='span2 aed_from' value='" + (v.from+1) + "' />" ;
			h += "</td><td>&ndash;</td><td>" ;
			h += "<input type='number' class='span2 aed_to' value='" + (v.to+1) + "' />" ;
			h += "</td><tr>" ;
			$('#aed_ranges').append ( h ) ;
		} ) ;
		
		$('#aed_rc').attr('checked',feat['_range'][0].rc) ;
		
		$('#aed_name').focus() ;
	} ) ;
}

/*
AnnotationEditorDialogDNA.prototype.deleteAnnotation = function ( id ) {
	var me = gentle.annotation_editor_dialog ;
	me.features.splice ( id , 1 ) ; // TODO only do on local copy, only commit onSaveButton
	$('#sid_annotation_tbody [rowid='+id+']').remove() ;
	return false ;
} ;

AnnotationEditorDialogDNA.prototype.showAnnotationDetails = function ( key ) {
	$("#sid_annotation_details").html ( "TODO! " + key ) ;
} ;
*/

AnnotationEditorDialogDNA.prototype.onCancelButton = function () {
	var me = gentle.annotation_editor_dialog ;
	return me.closeDialog() ;
}

AnnotationEditorDialogDNA.prototype.onSaveButton = function () {
	var me = gentle.annotation_editor_dialog ;
	var feat = me.sc.sequence.features[me.fid] ;
	
	if ( undefined !== me.name_key ) feat[me.name_key] = $('#aed_name').val() ;
	if ( undefined !== me.desc_key ) feat[me.desc_key] = $('#aed_desc').val() ;
	feat['_type'] = $('#aed_type').val() ;
	
	var rc = $('#aed_rc').attr('checked') ;
	feat['_range'] = [] ;
	$('#aed_ranges tr.aed_range').each ( function ( k1 , tr ) {
		var from = $(tr).find('.aed_from').val()*1 - 1 ;
		var to = $(tr).find('.aed_to').val()*1 - 1 ;
		if ( undefined === from || undefined === to ) return ;
		feat['_range'].push ( { rc:rc , from:from , to:to } ) ;
	} ) ;

	me.sc.recalc() ;
	me.sc.show () ;
	top_display.init() ;
	
	return me.closeDialog() ;
}
