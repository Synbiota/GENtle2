define(function(require) {
  var Gentle          = require('gentle')(),
      template        = require('hbars!templates/context_menu_view'),
      ContextMenuView;

  ContextMenuView = Backbone.View.extend({
    manage: true,
    template: template,

    events: {
      'click .menu-item': 'handleClick',
      'click .btn': 'toggleMenu'
    },

    initialize: function() {
      this.display = false;
      this.posX = 0;
      this.posY = 0;
      this.width = 240;
      this.menuItemHeight = 25;
      $('body').on('click', _.bind(this.hide, this));
    },

    reset: function() {
      this.menuItems = [];
      return this;
    },

    add: function(label, icon, callback) {
      if(callback === undefined) {
        callback = icon;
        icon = undefined;
      }

      this.menuItems.push({
        label: label,
        callback: callback,
        icons: icon,
        id: this.menuItems.length
      });

      return this;
    },

    move: function(posX, posY) {
      var parentOffset = this.$assumedParent.position();

      this.posX = posX + parentOffset.left;
      this.posY = posY + parentOffset.top;

      return this;
    },

    show: function() {
      var itemNb = this.menuItems.length;
      if(itemNb > 0) {
        var $parent = this.$assumedParent,
            parentWidth = $parent.width(),
            parentHeight = $parent.height();

        this.display = true;
        this.pullRight = this.posX + this.width >= parentWidth;
        this.dropup = this.posY + this.menuItemHeight * itemNb + 40 >= parentHeight;

        this.render();
        $parent.focus();
      }
      return this;
    },

    hide: function() {
      this.display = false;
      this.reset();
      this.render();
      return this;
    },

    handleClick: function(event) {
      var $element = $(event.currentTarget),
          menuItem = _.findWhere(this.menuItems, {id: $element.data('menu-item-id')});

      event.preventDefault();

      menuItem.callback.call(this.boundTo);
    },

    toggleMenu: function(event) {
      event.stopPropagation();
      event.preventDefault();
      $(event.currentTarget).dropdown('toggle');
    },

    serialize: function() {
      return {
        display: this.display,
        menuItems: this.menuItems,
        posX: this.posX,
        posY: this.posY,
        pullRight: this.pullRight,
        dropup: this.dropup
      };
    },


    

  });

  return ContextMenuView;
});