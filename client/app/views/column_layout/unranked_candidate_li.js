_.constructor("Views.ColumnLayout.UnrankedCandidateLi", Views.ColumnLayout.CandidateLi, {

  rootAttributes: {'class': "unranked candidate"},

  icons: function() { with(this.builder) {
    div({'class': "liIcons"}, function() {
      div({'class': "expandIcon", style: "display: none;"}).ref('expandIcon');
      div({'class': "rankedIcon", style: "display: none;"}).ref('rankedIcon');
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
        helper: this.hitch("createFixedWidthClone"),
        appendTo: this.containingView,
        start:  this.hitch("showRankedList"),
        distance: 5
      });
    },

    createFixedWidthClone: function() {
      var clone = this.clone();
      clone.css('width', this.width());
      clone.css('height', this.height());
      clone.removeClass('selected');
      return clone;
    },

    showRankedList: function() {
      this.containingView.showMainListAndRankedList();
      this.draggable('option', "connectToSortable", '.goodCandidatesList, .badCandidatesList')
    }
  }
});