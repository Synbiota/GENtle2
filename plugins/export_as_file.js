exportAsFile.prototype = new Plugin() ;
exportAsFile.prototype.constructor = exportAsFile ;

exportAsFile.prototype.exportCurrentSequence = function () {
	// Init
	var me = this ;
	this.sc = this.getCurrentSequenceCanvas() ;
	if ( this.sc === undefined ) return ; // Paranoia
	
	// Create dialog
	var h = "<div id='" + this.dialog_id + "'>" ;

	h += "<div><h3>File format</h3>" ;
	var first = true ;
	$.each ( gentle.fileTypeList , function ( k , v ) {
		var file = new window['FT_'+v](); // Check if export is supported
		if ( undefined === file.getExportBlob ) return ;
		h += "<div><input type='radio' name='file_export_format' value='"+v+"' id='file_export_format_"+v+"' " ;
		if ( first ) h += "checked " ;
		h += "/>&nbsp;<label for='file_export_format_"+v+"'>" + ucFirst(v) + "</label></div>" ;
		first = false ;
	} ) ;
	if ( first ) h += "<i>No file formats available for export</i>" ; // Paranoia
	h += "</div>" ;

	if ( !first ) {
		h += "<div><input id='file_export_name' type='text' size='50' /></div>" ;
		h += "<div><input type='button' id='do_file_export' value='Export file' /></div>" ;
	}

	h += "</div>" ;
	

	$('#'+this.dialog_id).remove() ;
	$('#all').append ( h ) ;
	$('#'+this.dialog_id).dialog ( { title : 'Export as file' , width:"auto" , modal:true } );
	$('#'+this.dialog_id).css ( { 'font-size' : '10pt' } ) ;
	$('#do_file_export').click ( function () { me.doExport() ; } ) ;
	$('input[name="file_export_format"]').change ( function() { me.fileTypeChange() ; } ) ;
	me.fileTypeChange() ;
}

exportAsFile.prototype.fileTypeChange = function () {
	var me = this ;
	var filetype = $('input[name="file_export_format"]:checked').val() ;
	var file = new window['FT_'+filetype]();
	var extension = file.getFileExtension() ;
	var filename = me.sc.sequence.name ;
	if ( extension != '' ) filename = filename.replace(/\.+$/,'') + '.' + extension ;
	$('#file_export_name').val ( filename ) ;
}

exportAsFile.prototype.doExport = function () {
	var me = this ;
	var filetype = $('input[name="file_export_format"]:checked').val() ;
	var filename = $('#file_export_name').val() ;
	
	var file = new window['FT_'+filetype](); // Check if export is supported
	var o = file.getExportBlob ( me.sc.sequence ) ;
	saveAs(o.blob, filename);
	$('#'+this.dialog_id).dialog('close') ;
}

function exportAsFile () {
	this.name = 'export_as_file' ;
	this.dialog_id = 'export_as_file_dialog' ;
}


if ( undefined !== getBlobBuilder() ) {
	if ( plugins.registerPlugin ( { className : 'exportAsFile' , url : 'plugins/export_as_file.js' } ) ) {
		plugins.registerAsTool ( { className : 'exportAsFile' , module : 'dna' , section : 'file' , call : 'exportCurrentSequence' , linkTitle : 'Export as file' } ) ;
	}
} else if ( !gentle.is_mobile ) {
	gentle.addAlert ( 'block' , "This browser does not seem to support BlobBuilder. Try current <a href='http://www.mozilla.org/en-US/firefox/new/'>FireFox</a>, <a href='https://www.google.com/chrome/'>Google Chrome</a>, or similar." ) ;
}
