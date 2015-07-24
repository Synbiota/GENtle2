/** 
@module Common
@submodule Views
@class NavbarView
**/
// define(function(require) {
  var template    = require('../templates/navbar_view.hbs'),
      Gentle      = require('gentle'),
      Backbone    = require('backbone'),
      tooltip     = require('gentle-utils/tooltip'),
      NavbarView;

  NavbarView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click #menu-button': 'navigateToHome',
      'click .sequence-tab': 'navigateToSequence',
      'click #sequence-tabs .close-sequence': 'closeSequence',
      'mouseenter #menu-button': 'showMenuButtonTooltip',
      'mouseleave #menu-button': 'hideMenuButtonTooltip'
    },
    leftMargin: 90,    // Hardcoding is ugly but to get CSS value
    minTabWidth: 100,   // would need rendering first
    tabPadding: 10,     //
    visibleTabIds: [],
    initialRender: true,

    initialize: function() {
      _.bindAll(this, 'render');
      this.debouncedRender = _.debounce(this.render, 200);
      Gentle.sequences.on('add remove reset sort', this.render, this);
      // Gentle.sequences.on('change', this.debouncedRender, this);
      $(window).on('resize', this.debouncedRender);
    },

    navigateToSequence: function(event) {
      var $target = $(event.currentTarget),
          $refTarget = $(event.target);

      if(!$target.parent().hasClass('hidden-tabs-dropdown') && !$refTarget.hasClass('close-sequence')) {
        event.preventDefault();
        Gentle.router.sequence($target.data('sequence_id'));
      }
    },

    navigateToHome: function(event) {
      Gentle.router.home();
      event.preventDefault();
    },

    closeSequence: function(event) {
      event.preventDefault();
      var sequence = Gentle.sequences.get($(event.currentTarget).closest('a').data('sequence_id')),
          nextSequence, visibleTabIdsIdx;

      if(sequence) {
        visibleTabIdsIdx = this.visibleTabIds.indexOf(sequence.get('id'));
        if(~visibleTabIdsIdx) {
          this.visibleTabIds.splice(visibleTabIdsIdx, 1);
        }
        sequence.destroy();
        nextSequence = Gentle.sequences.last();
        if(nextSequence) {
          Gentle.router.sequence(nextSequence.get('id'));
        } else {
          Gentle.router.home();
        }
      }
    },

    serialize: function() {

      var dropdownWidth = this.$el.find('.dropdown').width() || 0,
          secondaryDropdownWidth = $('#secondary-view-dropdown').width(),
          availableWidth = this.$el.find('#sequence-tabs').width() + dropdownWidth - secondaryDropdownWidth,
          sequences = Gentle.sequences.serialize(),
          currentSequenceId = Gentle.currentSequence && Gentle.currentSequence.get('id'),
          calculatedMaxTabWidth,
          nbVisibleTabs,
          visibleTabs,
          hiddenTabs,
          maxDropdownWidth,
          _this = this;

      // In order to properly determine tab spacing, we need to allow the view to render, and grab width data.
      // So we do nothing on initial render, and only display tabs once we have that initial data.
      if (!this.initialRender){

        calculatedMaxTabWidth = Math.max(
          Math.floor(availableWidth / Gentle.sequences.models.length),
          this.minTabWidth
        );

        nbVisibleTabs = Math.floor(availableWidth / calculatedMaxTabWidth);

        // If the dropdown tab is visible, we need to factor for its width.
        if (nbVisibleTabs < Gentle.sequences.models.length)
          nbVisibleTabs = Math.floor( (availableWidth-dropdownWidth) /calculatedMaxTabWidth)

        if(this.visibleTabIds.length <= nbVisibleTabs) {
          this.visibleTabIds = _.initial(_.pluck(sequences, 'id'), sequences.length - nbVisibleTabs);
        } else {
          this.visibleTabIds = _.initial(this.visibleTabIds, this.visibleTabIds.length - nbVisibleTabs);
        }

        if(currentSequenceId && !~this.visibleTabIds.indexOf(currentSequenceId)) {
          this.visibleTabIds.pop();
          this.visibleTabIds.unshift(currentSequenceId);
        }

        visibleTabs = _.map(this.visibleTabIds, function(id) {
          return _.findWhere(sequences, {id: id});
        });

        hiddenTabs = _.filter(sequences, function(sequence) {
          return !~_this.visibleTabIds.indexOf(sequence.id);
        });

        maxDropdownWidth = Math.floor($(window).width() * 0.75);
      }

      return {
        calculatedMaxTabWidth: calculatedMaxTabWidth,
        maxDropdownWidth: maxDropdownWidth,
        visibleTabs: visibleTabs,
        //We need to make sure the dropdown tab is visible for first render to get its dimensions.
        hiddenTabs: hiddenTabs || this.initialRender, 
        atHome: Backbone.history.fragment == 'home',
      };
    },

    afterRender: function() {
      // First render requires container width in order to properly space tabs.

      if (this.initialRender){
        this.initialRender = false;
        this.render();
      }
      else {

        var $tabsElements = this.$('#sequence-tabs li a');
        $tabsElements.each(function(i, element) {
          var $element = $(element);
          if($element.find('span.name').width() > $element.width()) {
            $element.tooltip({
              placement: 'bottom',
              container: 'body'
            });
          }
        });

        this.initialRender = true;

      }

    },

    showMenuButtonTooltip: function() {
      tooltip.show('New sequence, part, or circuit');
    },

    hideMenuButtonTooltip: function() {
      tooltip.hide();
    }
  });
export default NavbarView;
  // return NavbarView;
// });