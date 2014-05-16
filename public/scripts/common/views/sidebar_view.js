define(function(require) {
  var Backbone      = require('backbone.mixed'),
      template      = require('hbars!common/templates/sidebar_view'),
      SidebarView;

  SidebarView = Backbone.View.extend({
    manage: true,
    template: template,
    tabs: {},

    events: {
      'click .sidebar-tab-link': 'toggleTabs',
    },

    addTab: function(name, title, icon, view, maxHeighted) {
      this.tabs[name] = {
        name: name, 
        title: title, 
        icon: icon,
        view: view,
        maxHeighted: !!maxHeighted
      };
    },

    closeOpenTabs: function() {
      this.$('.active').removeClass('active');
      _.each(this.tabs, function(tab){
        tab.view.isOpen = false;
      });
    },

    toggleTabs: function(event) {
      event.preventDefault();
      var $link = this.$(event.currentTarget),
          wasActive = this.$el.hasClass('active'),
          view;

      if($link.hasClass('active')) {
        this.$el.removeClass('active');
        this.openTab = undefined;
        this.closeOpenTabs();
      } else {
        view = this.tabs[$link.attr('href').replace('#' + this.sidebarName + '-', '')].view;
        this.closeOpenTabs();
        $($link.attr('href') + '-tab').addClass('active');
        this.openTab = $link.attr('href');
        if(!wasActive) {
          this.$el.addClass('active');
        }
        $link.addClass('active');
        view.isOpen = true;
        view.render();
      }

      if((wasActive && !this.$el.hasClass('active')) ||
        !wasActive && this.$el.hasClass('active')) 
          this.trigger('resize');
    },

    serialize: function() {
      return {
        openTab: this.openTab,
        sidebarName: this.sidebarName,
        tabs: this.tabs
      };
    },

    restoreOpenTab: function() {
      if(this.openTab !== undefined) {
        this.$el.addClass('active');
        this.$('[href='+this.openTab+']').addClass('active');
        $(this.openTab).addClass('active');
      }
    },

    insertTabs: function() {
      var _this = this,
          name;

      _.each(this.tabs, function(tab) {
        name = '#' + _this.sidebarName + '-' + tab.name ;
        _this.setView(name+ '-tab', tab.view).render();
        tab.view.$toggleButton = this.$('[href="' + name + '"]');
      });
    },

    afterRender: function() {
      this.insertTabs();
      this.restoreOpenTab();
    },
  });

  return SidebarView;
})