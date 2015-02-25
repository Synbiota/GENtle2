/**
@module Common
@submodule Views
@class SidebarView
**/
define(function(require) {
  var Backbone      = require('backbone'),
      _             = require('underscore'),
      template      = require('../templates/sidebar_view.hbs'),
      SidebarView;

  SidebarView = Backbone.View.extend({
    manage: true,
    template: template,
    tabs: {},

    events: {
      'click .sidebar-tab-link': 'toggleTabs',
      // 'mouseover .sidebar-tab-link': 'mouseoverTabLink',
      // 'mouseout .sidebar-tab-link': 'mouseoutTabLink',
      // 'mouseover .sidebar-tab': 'mouseoverTab',
      // 'mouseout .sidebar-tab': 'mouseoutTab'
    },

    addTab: function(options) {
      var _this = this;
      if(!_.isArray(options)) options = [options];
      _.each(options, function(options_) {
        options_.maxHeighted = !!options_.maxHeighted;
        options_.hoverable = !!options_.hoverable;
        if(options_.viewClass === undefined) {
          options_.viewClass = options_.view;
        }
        options_.view = new options_.viewClass();
        options_.iconIsImage = /\//.test(options_.icon);
        _this.tabs[options_.name] = options_;
      });
    },

    closeOpenTabs: function(closeSidebar = false) {
      this.$('.active').removeClass('active');
      _.each(this.tabs, function(tab){
        tab.view.isOpen = false;
      });
      if(closeSidebar) {
        this.$el.removeClass('active');
        this.openTab = undefined;
        this.initTooltips();
      }
    },

    toggleTabs: function(event) {
      event.preventDefault();
      var $link = this.$(event.currentTarget),
          wasActive = this.$el.hasClass('active'),
          view;

      this.$('.hovered').removeClass('hovered');
      this.$el.removeClass('hovered');

      if($link.hasClass('active')) {
        // this.$el.removeClass('active');
        // this.openTab = undefined;
        this.closeOpenTabs(true);
      } else {
        this.closeOpenTabs();
        view = this.getTabFromLinkHref($link.attr('href')).view;
        $($link.attr('href') + '-tab').addClass('active');
        this.openTab = $link.attr('href');
        if(!wasActive) {
          this.$el.addClass('active');
        }
        $link.addClass('active');
        view.isOpen = true;
        view.render();
        this.destroyTooltips();
      }

      if((wasActive && !this.$el.hasClass('active')) ||
        !wasActive && this.$el.hasClass('active')) 
          this.trigger('resize');
    },

    // mouseoverTabLink: function(event) {
    //   var $link = this.$(event.currentTarget),
    //       tab = this.getTabFromLinkHref($link.attr('href'));

    //   if(!this.$el.hasClass('active')) {

    //     if(this.closingTabName == tab.name) {
    //       this.closingTabName = this.closingTabTimeout = clearTimeout(this.closingTabTimeout);
    //     } 

    //     if(!$link.hasClass('hovered')) {
    //       this.$('.hovered').removeClass('hovered');
    //       if(tab.hoverable) {
    //         tab.view.isOpen = true;
    //         tab.view.$el.parent().parent().addClass('hovered');
    //         tab.view.render();
    //         this.$el.addClass('hovered');
    //         $link.addClass('hovered');
    //       }
    //     }
    //   }
    // },

    // mouseoutTabLink: function(event) {
    //   var _this = this,
    //       tab = this.getTabFromLinkHref($(event.currentTarget).attr('href'));

    //   event.preventDefault();
    //   this.closingTabName = tab.name;
    //   this.closingTabTimeout = setTimeout(_.bind(this.deferredClosePopoutTab, this), 50);
    // },

    // mouseoverTab: function(event) {
    //   var tabName = $(event.currentTarget).attr('id').replace('-tab', '').replace('sequence-', '');
    //   if(this.closingTabName == tabName) {
    //     this.closingTabName = this.closingTabTimeout = clearTimeout(this.closingTabTimeout);
    //   }
    // },

    // mouseoutTab: function(event) {
    //   var tabName = $(event.currentTarget).attr('id').replace('-tab', '').replace('sequence-', '');
    //   this.closingTabName = tabName;
    //   this.closingTabTimeout = setTimeout(_.bind(this.deferredClosePopoutTab, this), 50);
    // },

    // deferredClosePopoutTab: function() {
    //   var name = this.closingTabName;
    //   if(name) {
    //     this.$getTabLink(name).removeClass('hovered');
    //     this.$getTab(name).removeClass('hovered');
    //   }
    // },

    getTabFromLinkHref: function(href) {
      return this.tabs[href.replace('#' + this.sidebarName + '-', '')];
    },

    $getTabLink: function(name) {
      return this.$('[href="#'+this.sidebarName + '-' + name +'"]');
    },

    $getTab: function(name) {
      return this.$('#' + this.sidebarName + '-' + name + '-tab');
    },

    serialize: function() {
      return {
        openTab: this.openTab,
        sidebarName: this.sidebarName,
        tabs: this.getVisibleTabs()
      };
    },

    restoreOpenTab: function() {
      console.log('restoringOpenTab', this.openTab)
      if(this.openTab !== undefined) {
        this.$el.addClass('active');
        this.$('[href='+this.openTab+']').addClass('active');
        $(this.openTab).addClass('active');
      }
    },

    getVisibleTabs: function() {
      return _.filter(this.tabs, function(tab) {
        return tab.visible === undefined || tab.visible();
      });
    },

    insertTabs: function() {
      _.each(this.getVisibleTabs(), (tab) => {
        var name = '#' + this.sidebarName + '-' + tab.name ;
        this.setView(name+ '-tab .sidebar-tab-outlet', tab.view).render();
        tab.view.$toggleButton = this.$('[href="' + name + '"]');
      });
    },

    afterRender: function() {
      this.insertTabs();
      // this.restoreOpenTab();
      this.initTooltips();
    },

    initTooltips: function() {
      this.$('.sidebar-tab-link').tooltip({
        container: 'body',
        animation: false
      });
    },

    destroyTooltips: function() {
      this.$('.sidebar-tab-link').tooltip('destroy');
    }
  });

  return SidebarView;
})