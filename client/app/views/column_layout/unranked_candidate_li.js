_.constructor("Views.ColumnLayout.UnrankedCandidateLi", Views.ColumnLayout.CandidateLi, {

  rootAttributes: {'class': "unranked candidate"},

  icons: function() { with(this.builder) {
    div({'class': "icons"}, function() {
      div({'class': "rankedIcon", style: "display: none;"}).ref('rankedIcon');
      div({'class': "loadingIcon", style: "display: none;"}).ref('loadingIcon');
    });
  }},

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
        revert: 'invalid',
        revertDuration: 100,
        appendTo: this.containingView,
        helper: this.hitch("createFixedWidthClone"),
        start:  this.hitch("showRankedList")
      });
    },

    createFixedWidthClone: function() {
      var clone = this.clone();
      clone.css('width', this.width());
      clone.css('height', this.height());
      return clone;
    },

    showRankedList: function() {
      this.containingView.showMainListAndRankedList();
    }
  }
});