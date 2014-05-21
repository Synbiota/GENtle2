  define(function(require) {
  var template    = require('hbars!common/templates/navbar_view'),
      Gentle      = require('gentle')(),
      Backbone    = require('backbone.mixed'),
      NavbarView;

  NavbarView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click #menu-button': 'navigateToHome',
      'click #sequence-tabs li a': 'navigateToSequence',
      'click #sequence-tabs .close-sequence': 'closeSequence'
    },
    leftMargin: 120,    // Hardcoding is ugly but to get CSS value
    minTabWidth: 150,   // would need rendering first
    tabPadding: 10,     //
    visibleTabIds: [],

    initialize: function() {
      Gentle.sequences.on('add reset sort', this.render, this);
      $(window).on('resize', _.debounce(_.bind(this.render, this), 200));
    },

    navigateToSequence: function(event) {
      var $target = $(event.currentTarget);
      if(!$target.parent().hasClass('hidden-tabs-dropdown')) {
        Gentle.router.sequence($target.data('sequence-id'));
        event.preventDefault();
      }
    },

    navigateToHome: function(event) {
      Gentle.router.home();
      event.preventDefault();
    },

    closeSequence: function(event) {
      event.preventDefault();
      var sequence = Gentle.sequences.get($(event.currentTarget).closest('a').data('sequence-id')),
          nextSequence, visibleTabIdsIdx;

      if(sequence) {
        visibleTabIdsIdx = this.visibleTabIds.indexOf(sequence.get('id'));
        if(~visibleTabIdsIdx) {
          this.visibleTabIds.splice(visibleTabIdsIdx, 1);
        }
        sequence.destroy();
        nextSequence = Gentle.sequences.last();
        if(nextSequence)
          Gentle.router.sequence(nextSequence.get('id'));
        else
          Gentle.router.home();
      }
    },

    serialize: function() {
      var availableWidth = $(window).width() - this.leftMargin,
          sequences = Gentle.sequences.serialize(),
          currentSequenceId = Gentle.currentSequence && Gentle.currentSequence.get('id'),
          calculatedMaxTabWidth,
          nbVisibleTabs,
          visibleTabs,
          hiddenTabs,
          maxDropdownWidth,
          _this = this;

      calculatedMaxTabWidth = Math.max(
        Math.floor(availableWidth / Gentle.sequences.models.length) - this.tabPadding,
        this.minTabWidth
      );
      nbVisibleTabs = Math.floor(availableWidth / calculatedMaxTabWidth);

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

      return {
        calculatedMaxTabWidth: calculatedMaxTabWidth,
        maxDropdownWidth: maxDropdownWidth,
        visibleTabs: visibleTabs,
        hiddenTabs: hiddenTabs,
        atHome: Backbone.history.fragment == 'home',
      };
    }
  });

  return NavbarView;
});