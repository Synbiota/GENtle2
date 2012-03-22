//________________________________________________________________________________________
// SequenceInfoDialog base class
function SequenceInfoDialog ( sc ) {
	console.log ( "Don't do that" ) ;
}

SequenceInfoDialog.prototype.onCancelButton = function () {}
SequenceInfoDialog.prototype.onSaveButton = function () {}


//________________________________________________________________________________________
// SID DNA
SequenceInfoDialogDNA.prototype = new SequenceCanvas() ;
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
	dialogContainer.load ( "public/templates/sequence_info_dialog_dna.html", function(){
		var me = gentle.sequence_info_dialog ;
		
		dialogContainer.appendTo("#all");
		$('#'+me.sid).modal();
		
		// TODO initialize display
		$('#sid_name').val ( me.data.name ) ;
		$('#sid_desc').val ( me.data.desc ) ;
		
		$('#sid_tab').tab('show') ;
		$('#sid_tab a:first').tab('show')
	} ) ;
}

SequenceInfoDialogDNA.prototype.onCancelButton = function () {
	$('#'+gentle.sequence_info_dialog.sid).modal('hide');
	$('#'+gentle.sequence_info_dialog.sid).remove();
}

SequenceInfoDialogDNA.prototype.onSaveButton = function () {
	$('#'+gentle.sequence_info_dialog.sid).modal('hide');
	$('#'+gentle.sequence_info_dialog.sid).remove();
}
