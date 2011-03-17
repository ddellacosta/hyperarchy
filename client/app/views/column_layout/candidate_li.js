_.constructor("Views.ColumnLayout.CandidateLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "unranked candidate"}, function() {
      a({'class': "body"}).ref("body").click('expand');
      div({'class': "expandIcon", style: "display: none;"}).ref('expandIcon');
      div({'class': "rankedIcon", style: "display: none;"}).ref('rankedIcon');
    }).ref("li").click('showDetails');
  }},

  viewProperties: {

    initialize: function() {
      this.attr("candidateId", this.record.id());
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.subscribeToRecordChanges();
      this.setupDraggable();
    },

    subscribeToRecordChanges: function() {
      this.subscriptions.destroy();
      this.body.bindHtml(this.record, "body");
      var rankingRelation = this.record.rankingByCurrentUser();
      if (!rankingRelation.empty()) {
        this.rankedIcon.show();
      }
      this.subscriptions.add(rankingRelation.onInsert(function() {
        this.rankedIcon.show();
      }, this));
      this.subscriptions.add(rankingRelation.onRemove(function() {
        this.rankedIcon.hide();
      }, this));
    },

    setupDraggable: function() {
      this.draggable({
        connectToSortable: '.rankedCandidatesList',
        revert: 'invalid',
        revertDuration: 100,
        helper: this.hitch("createFixedWidthClone"),
        appendTo: this.containingView,
        start:  this.hitch("showRankedList"),
        distance: 5
      });
    },

    showDetails: function() {
      this.containingView.showMainListAndDetailsArea();
      this.containingView.selectedRecordId(this.record.id());
    },

    showRankedList: function() {
      this.containingView.showMainListAndRankedList();
    },

    createFixedWidthClone: function() {
      var clone = this.clone();
      clone.css('width', this.width());
      clone.css('height', this.height());
      clone.removeClass('selected');
      return clone;
    }
  }
});