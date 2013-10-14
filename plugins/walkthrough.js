Walkthrough.prototype = new Plugin() ;

Walkthrough.prototype.constructor = Walkthrough ;

Walkthrough.prototype.sup = function() {
  console.log("sup")
}

function Walkthrough() {
  this.name = "walkthrough"
}

function showWalkthrough() {
  wt = new Walkthrough()
  wt.sup()
}

if(plugins.registerPlugin({ className: 'Walkthrough' , url: 'plugins/walkthrough.js' , name: 'walkthrough'} )) {
  plugins.addSection("dna","Walkthrough")
  plugins.registerAsTool ( { className : 'Walkthrough' , module : 'dna' , section : 'Walkthrough' , call : 'sup' , linkTitle : 'Show Walkthrough' } ) ;

}