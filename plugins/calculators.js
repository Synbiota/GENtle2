/**
 	@extends Plugin
*/
PluginCalculators.prototype = new Plugin() ;

PluginCalculators.prototype.constructor = PluginCalculators ;

/**
	Opens the find dialog.
	@deprecated in favor of toolbar query box
*/
PluginCalculators.prototype.startDialog = function () {
	// Init
	this.sc = this.getCurrentSequenceCanvas() ;
	if ( this.sc === undefined ) return ; // Paranoia
	this.dna_forward = this.sc.sequence.seq ;
	this.dna_rc = rcSequence ( this.dna_forward ) ;

	// Create dialog
	var h = "<div id='" + this.dialog_id + "'>" ;
	h += "<div><input type='text' size='40' id='"+this.query_id+"' /></div>" ;
	h += "<div id='"+this.result_id+"' style='max-height:300px;height:300px;overflow:auto'></div>" ;
	h += "</div>" ;

	$('#'+this.dialog_id).remove() ;
	$('#all').append ( h ) ;
	$('#'+this.dialog_id).dialog ( { title : 'Calculators' , width:"auto" } );
	$('#'+this.dialog_id).css ( { 'font-size' : '10pt' } ) ;
	
	var me = this ;
//	sc.unbindKeyboard() ;
	$('#'+this.query_id).keyup(function(){me.queryChanged();}) ;
}


function PluginCalculators () {
        this.name = 'calculators' ;
        this.dialog_id = 'calculators_dialog' ;
        this.query_id = this.dialog_id + "_query" ;
        this.result_id = this.dialog_id + "_result" ;
        this.uses_dialog = true ;
        this.dropdown_focusout_cancel = false ;
}


// Register plugin
if ( plugins.registerPlugin ( { className : 'PluginCalculators' , url : 'plugins/calculators.js' , name : 'calculators' } ) ) {

	plugins.registerAsTool ( { className : 'PluginCalculators' , module : 'dna' , section : 'sequence' , call : 'startDialog' , linkTitle : 'Calculators' } ) ;

}
