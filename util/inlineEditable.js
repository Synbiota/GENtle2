//
// simple jQuery plugin to allow inline editing of any element. 
// Save logic is provided as callback.
//
// example
//   $('#elemnet').inlineEditable({
//    onSaveCallback: function() {
//      gentle.save();
//     }  
//   })

function inlineEditable(reference, opts) {
  this.$input = $('<input type="text" />');
  this.$ref = $(reference); // Ref is the DOM element to be inline-edited
  this.value = opts.value;
  this.$ref.after(this.$input);
  this.minWidth = opts.minWidth || 250;
  this.onSaveCallback = opts.onSaveCallback;
  this.editingClass = opts.editingClass || '';
  this.bindEventsToRef();
  this.initStyle();
}

inlineEditable.prototype.bindEventsToRef = function() {
  var that = this;
  this.$ref.on('click', function(e) {
    that.show();
    e.stopPropagation();
  });
}

inlineEditable.prototype.bindEventsToInput = function() {
  var that = this;
  this.$input
    .on('click', function(e) { e.stopPropagation(); })
    .on('keydown', function(e) {
      switch(e.keyCode) {
        case 13: //enter
          that.save();
          break;
        case 9: //enter
          that.save();
          break;
        case 27: //escape
          that.hide();
      }
    })
    .on( "blur", function(e){ if(that.$input.is( ":visible" )){that.save();}} );
  $('html').on('click', function() {
    that.hide();
  });
}
inlineEditable.prototype.unbindEventsToInput = function() {
  this.$input.off('click').off('keydown');
  $('html').off('click');
}

inlineEditable.prototype.initStyle = function() {
  this.$input.addClass(this.editingClass)
  var deltaWidth = this.$input.outerWidth(true) - this.$input.width();
  this.$input.width(this.$ref.outerWidth() - deltaWidth).hide();
}

inlineEditable.prototype.show = function () {
  this.$input.val(this.value || this.$ref.attr('title'));
  this.$input.show().focus();
  this.$ref.hide();
  this.bindEventsToInput();
}

inlineEditable.prototype.hide = function () {
  this.$input.hide()
  if (this.$input.is(":focus")){
    this.$input.blur();
  }
  this.$ref.show();
  this.unbindEventsToInput();
}

inlineEditable.prototype.save = function () {
  this.hide();
  this.value = this.$input.val();
  this.$ref.text(this.value.trunc(50, true));
  this.$ref.attr('title', this.value.escapeHTML(true));
  this.onSaveCallback(this.value);
}

$.fn.inlineEditable = function(opts) { new inlineEditable(this, opts); }
