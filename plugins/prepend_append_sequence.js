PluginPrependAppendSequence.prototype = new Plugin() ;
PluginPrependAppendSequence.prototype.constructor = PluginPrependAppendSequence ;

PluginPrependAppendSequence.prototype.startDialog = function () {
	// Init
	var me = this ;
	me.sc = this.getCurrentSequenceCanvas() ;
	if ( me.sc === undefined ) return ; // Paranoia

	var h = "<div id='" + me.dialog_id + "'>" ;
	h += "<div>" ;

	// Add sequences
	h += "<h3>Available sequences</h3>" ;
	h += "<select id='"+me.dialog_id+"_seq' size=10>" ;
	var first = true ;
	$.each ( gentle.sequences , function ( k , v ) {
		if ( gentle.current_sequence_entry == k ) return ; // Don't add current sequence
		if ( v.typeName != 'dna' ) return ; // Add only DNA
		h += "<option value='" + k + "'" ;
		if ( first ) {
			h += " selected" ;
			first = false ;
		}
		h += ">" + v.name + " (" + v.seq.length + "bp)</option>" ;
	} ) ;
	h += "</select>" ;
	
	// Mode
	h += "<div>" ;
	h += "Insert sequence:<br/>" ;
	h += this.get_mode_radio ( 'pre_seq' , 'Before current sequence' , true , false ) ;
	h += this.get_mode_radio ( 'post_seq' , 'After current sequence' , false , false ) ;
	
	var use_selection = ! ( me.sc.selections !== undefined && me.sc.selections.length > 0 ) ;
	
	h += this.get_mode_radio ( 'pre_sel' , 'Before selection' , false , use_selection ) ;
	h += this.get_mode_radio ( 'post_sel' , 'After selection' , false , use_selection ) ;
	h += "</div>" ;

	// Button
	h += "<div>" ;
	h += "<input type='button' id='"+me.dialog_id+"_button' value='Insert sequence' />" ;
	h += "</div>" ;

	h += "</div>" ;
	h += "</div>" ;

	$('#'+this.dialog_id).remove() ;
	$('#all').append ( h ) ;
	$('#'+this.dialog_id).dialog ( { title : 'Prepend/append sequence' , width:"auto" , modal : true } );
	$('#'+this.dialog_id).css ( { 'font-size' : '10pt' } ) ;
	$('#'+this.dialog_id+'_button').click ( function () { me.insertSequence() ; } ) ;
}

PluginPrependAppendSequence.prototype.insertSequence = function () {
	var me = this ;
	var seqid = $('#'+me.dialog_id+'_seq option:selected').val() ;
	var mode = $('input[name="'+me.dialog_id+'_mode"]:checked','#'+me.dialog_id).val() ;
	console.log ( mode ) ;
	
	var pos ;
	switch ( mode ) {
		case 'pre_seq' : pos = 0 ; break ;
		case 'post_seq' : pos = me.sc.sequence.seq.length ; break ;
		case 'pre_sel' : pos = me.sc.selections[0].from ; break ;
		case 'post_sel' : pos = me.sc.selections[0].to+1 ; break ;
	}
	console.log ( pos ) ;
	
	$('#'+me.dialog_id).dialog ( 'close' ) ;

	// Insert sequence
	me.sc.sequence.insert ( pos , gentle.sequences[seqid].seq ) ;
	
	// Insert "total" feature
	me.sc.sequence.features.push ( {
		'_range' : [ { from:pos , to:pos+gentle.sequences[seqid].seq.length , rc:false } ] ,
		'_type':'other' ,
		gene:gentle.sequences[seqid].name
	} ) ;
	
	// Duplicate features for inserted sequence
	$.each ( gentle.sequences[seqid].features , function ( k , v ) {
		var nf = $.extend(true, {}, v) ;
		$.each ( nf['_range'] , function ( k2 , v2 ) {
			v2.from += pos ;
			v2.to += pos ;
		} ) ;
		me.sc.sequence.features.push ( nf ) ;
	} ) ;

	me.sc.recalc() ;
	top_display.init() ;
	me.sc.ensureBaseIsVisible ( pos ) ;
	me.sc.show() ;
}

PluginPrependAppendSequence.prototype.get_mode_radio = function ( value , text , checked , disabled ) {
	var me = this ;
	var h = '' ;
	h += "<input type='radio' name='"+me.dialog_id+"_mode' id='"+me.dialog_id+"_"+value+"' value='"+value+"'" ;
	if ( checked ) h += "checked " ;
	if ( disabled ) h += "disabled " ;
	h += " /><label for='"+me.dialog_id+"_"+value+"'>"+text+"</label><br/>" ;
	return h ;
}

function PluginPrependAppendSequence () {
	this.name = 'prepend_append_sequence' ;
	this.dialog_id = 'prepend_append_sequence_dialog' ;
}

// Register plugin
if ( plugins.registerPlugin ( { className : 'PluginPrependAppendSequence' , url : 'plugins/prepend_append_sequence.js' } ) ) {
	plugins.registerAsTool ( { className : 'PluginPrependAppendSequence' , module : 'dna' , section : 'sequence' , call : 'startDialog' , linkTitle : 'Prepend/append sequence' } ) ;
}
