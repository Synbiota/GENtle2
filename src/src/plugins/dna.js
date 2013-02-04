// This is the DNA default plugin.

PluginDNA.prototype = new Plugin() ;
PluginDNA.prototype.constructor = PluginDNA ;

PluginDNA.prototype.editNDA = function () {
	gentle.sequence_info() ;
}

PluginDNA.prototype.displaySettings = function () {
	gentle.toggle_display_settings() ;
}

function PluginDNA () {
	this.name = 'dna' ;
}

if ( plugins.registerPlugin ( { className : 'PluginDNA' , url : 'plugins/dna.js' , name : 'dna' } ) ) {
	plugins.registerAsTool ( { className : 'PluginDNA' , module : 'dna' , section : 'sequence' , call : 'editNDA' , linkTitle : 'Edit name, description, and annotation' } ) ;
	plugins.registerAsTool ( { className : 'PluginDNA' , module : 'dna' , section : 'sequence' , call : 'displaySettings' , linkTitle : 'Display settings' } ) ;
}
