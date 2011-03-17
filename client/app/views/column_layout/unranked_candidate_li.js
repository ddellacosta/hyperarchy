_.constructor("Views.ColumnLayout.UnrankedCandidateLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "unranked candidate"}, function() {
      span({'class': "liBody"}).ref("body");
      div({'class': "liIcon"}).ref('rankedOrExpandIcon');
    }).ref("li").click('showDetails');
  }},

  viewProperties: {

    initialize: function() {
      this.candidate = this.candidate || this.record;
      this.attr("candidateId", this.candidate.id());
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.setupDraggable();
      this.populateContent();

      this.mouseover(this.hitch('showExpandIcon'));
      this.mouseout(this.hitch('hideExpandIcon'));
    },

    populateContent: function() {
      this.body.bindHtml(this.candidate, "body");
      var rankingRelation = this.candidate.rankingByCurrentUser();
      if (!rankingRelation.empty()) {
        this.showRankedIcon();
      }
      this.subscriptions.destroy();
      this.subscriptions.add(rankingRelation.onInsert(function() {
        this.showRankedIcon();
      }, this));
      this.subscriptions.add(rankingRelation.onRemove(function() {
        this.hideRankedIcon();
      }, this));
    },

    setupDraggable: function() {
      this.draggable({
        connectToSortable: '.rankedCandidatesList',
        revert: 'invalid',
        revertDuration: 100,
        helper: this.hitch("createCloneForDragging"),
        appendTo: this.containingView,
        start:  this.hitch("showRankedList"),
        distance: 5
      });
    },

    showDetails: function() {
      this.containingView.showMainListAndDetailsArea();
      this.containingView.selectedRecordId(this.candidate.id());
    },

    showRankedList: function() {
      this.containingView.showMainListAndRankedList();
    },

    showRankedIcon: function() {
      this.rankedOrExpandIcon.addClass('rankedIcon');
    },

    hideRankedIcon: function() {
      this.rankedOrExpandIcon.removeClass('rankedIcon');
    },

    showExpandIcon: function() {
      this.rankedOrExpandIcon.addClass('expandIcon');
    },

    hideExpandIcon: function() {
      this.rankedOrExpandIcon.removeClass('expandIcon');
    },

    createCloneForDragging: function() {
      var clone = this.clone();
      clone.css('width', this.width());
      clone.css('height', this.height());
      clone.removeClass('selected');
      clone.find('.liIcon').remove();
      return clone;
    }
  }
});