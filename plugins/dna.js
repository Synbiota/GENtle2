// These dummy "plugins" add sequence-type-specific menus etc. for standard sequence type modules.

// This is the DNA default plugin.

PluginDNA.prototype = new Plugin() ;
PluginDNA.prototype.constructor = PluginDNA ;

PluginDNA.prototype.editDNA = function () {
	gentle.sequence_info() ;
}

PluginDNA.prototype.displaySettings = function () {
	gentle.toggle_display_settings() ;
}

function PluginDNA () {
	this.name = 'dna' ;
}

if ( plugins.registerPlugin ( { className : 'PluginDNA' , url : 'plugins/dna.js' , name : 'dna' } ) ) {
	plugins.registerAsTool ( { className : 'PluginDNA' , module : 'dna' , section : 'sequence' , call : 'editDNA' , linkTitle : 'Edit name, description, and annotation' } ) ;
	plugins.registerAsTool ( { className : 'PluginDNA' , module : 'dna' , section : 'sequence' , call : 'displaySettings' , linkTitle : 'Display settings' } ) ;
}


// This is the PCR default plugin.

PluginPCR.prototype = new Plugin() ;
PluginPCR.prototype.constructor = PluginPCR ;

PluginPCR.prototype.displaySettings = function () {
	gentle.toggle_display_settings() ;
}

PluginPCR.prototype.exportProduct = function () {
	var seq = gentle.main_sequence_canvas.sequence ;
	var nseq = seq.asNewSequenceDNA ( seq.pcr_product_start , seq.pcr_product_stop ) ;
	gentle.addSequence ( nseq , true ) ;
}

function PluginPCR () {
	this.name = 'pcr' ;
}

if ( plugins.registerPlugin ( { className : 'PluginPCR' , url : 'plugins/dna.js' , name : 'dna' } ) ) {
//	plugins.registerAsTool ( { className : 'PluginPCR' , module : 'pcr' , section : 'sequence' , call : 'editDNA' , linkTitle : 'Edit name, description, and annotation' } ) ;
//	plugins.registerAsTool ( { className : 'PluginPCR' , module : 'pcr' , section : 'sequence' , call : 'displaySettings' , linkTitle : 'Display settings' } ) ;
	plugins.registerAsTool ( { className : 'PluginPCR' , module : 'pcr' , section : 'sequence' , call : 'exportProduct' , linkTitle : 'Generate new DNA sequence from PCR product' } ) ;
}
