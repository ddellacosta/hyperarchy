_.constructor("Views.ColumnLayout.UnrankedCandidateLi", Views.ColumnLayout.CandidateLi, {

  icons: function() { with(this.builder) {
    div({'class': "icons"}, function() {
      div({'class': "rankedIcon", style: "display: none;"}).ref('rankedIcon');
      div({'class': "loadingIcon", style: "display: none;"}).ref('loadingIcon');
    });
  }},

  rootAttributes: {'class': "unranked candidate"},

  viewProperties: {
    initialize: function($super) {
      $super();
      var rankingRelation = this.record.rankingByCurrentUser();
      if (!rankingRelation.empty()) {
        this.rankedIcon.show();
      }
      rankingRelation.onInsert(function() {
        this.rankedIcon.show();
      }, this);
      rankingRelation.onRemove(function() {
        this.rankedIcon.hide();
      }, this);

      this.draggable({
        connectToSortable: '.goodCandidatesList, .badCandidatesList',
        containment: this.containingView,
        revert: 'invalid',
        revertDuration: 100,
        helper: this.hitch("createFixedWidthClone"),
        zIndex: 100,
        cancel: '.noDrag'
      }).disableSelection();
    },

    createFixedWidthClone: function() {
      var clone = this.clone();
      clone.css('width', this.width());
      clone.css('height', this.height());
      return clone;
    }
  }
});