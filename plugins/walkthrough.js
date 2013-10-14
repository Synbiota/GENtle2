Walkthrough.prototype = new Plugin() ;

Walkthrough.prototype.constructor = Walkthrough ;

Walkthrough.prototype.sup = function() {
  console.log("sup")
}

Walkthrough.prototype.tourOptions = function() {
  return {
    name: "gentle_tour",
    container: "body",
    keyboard: true,
    storage: window.localStorage,
    debug: false,
    backdrop: false,
    redirect: true,
    orphan: false,
    basePath: "",
    afterStart: function() {
      console.log("starting walkthrough")
    }
    //afterGetState: function(key, value) {},
    //afterSetState: function(key, value) {},
    //afterRemoveState: function(key, value) {},
    //onStart: function(tour) {},
    //onEnd: function(tour) {},
    //onShow: function(tour) {},
    //onShown: function(tour) {}
    //onHide: function(tour) {},
    //onHidden: function(tour) {},
    //onNext: function(tour) {},
    //onPrev: function(tour) {}
  }
}

Walkthrough.prototype.setupTour = function() {
  this.tour = new Tour(this.tourOptions)
}

Walkthrough.prototype.setupSteps = function() {
  this.tour.addStep({
    element: "#help_menu_wrapper",
    title: "Help",
    content: "This is where help comes from. There's a menu with many options."
  });
  this.tour.addStep({
    element: "#sequence_canvas",
    title: "Sequence",
    content: "It puts the science in the canvas. You must type the science correctly for optimal results."
  })
  this.tour.addStep({
    element: "a.brand",
    title: "Gentle",
    content: "Click this link to return to where you are.",
    placement: "right"
  })
}

function Walkthrough() {
  this.name = "walkthrough"
}

function showWalkthrough() {
  wt = new Walkthrough()
  wt.setupTour()
  wt.setupSteps()
  wt.tour.start(true)
}

if(plugins.registerPlugin({ className: 'Walkthrough' , url: 'plugins/walkthrough.js' , name: 'walkthrough'} )) {
  plugins.addSection("dna","Walkthrough")
  plugins.registerAsTool ( { className : 'Walkthrough' , module : 'dna' , section : 'Walkthrough' , call : 'sup' , linkTitle : 'Show Walkthrough' } ) ;
  $("#show_walkthrough_link").click(function(e) {
    e.preventDefault();
    showWalkthrough();
  })
}