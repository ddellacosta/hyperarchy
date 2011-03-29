_.constructor("Views.ColumnLayout.UnrankedCandidateLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "unranked recordLi"}, function() {
      div({'class': "icon"}).ref('icon');
      span({'class': "body"}).ref("body");
    }).ref("li").click('select');
  }},

  viewProperties: {

    initialize: function() {
      this.candidate = this.candidate || this.record;
      this.attr("candidateId", this.candidate.id());
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.setupDraggable();
      this.populateContent();
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
        connectToSortable: '.ranked,.recordsList > ol',
        revert: 'invalid',
        revertDuration: 100,
        helper: this.hitch("createCloneForDragging"),
        appendTo: this.containingView,
        start:  this.hitch("showRankedList"),
        distance: 5
      });
    },

    select: function() {
      this.containingView.containingColumn.pushState({
        recordId: this.candidate.id()
      });
    },

    showRankedList: function() {
      this.containingView.showRankedList();
    },

    showRankedIcon: function() {
      this.icon.addClass('ranked');
    },

    hideRankedIcon: function() {
      this.icon.removeClass('ranked');
    },

    createCloneForDragging: function() {
      var clone = this.clone();
      clone.css('width', this.width());
      clone.css('height', this.height());
      clone.removeClass('selected');
      clone.find('.icon').remove();
      return clone;
    }
  }
});