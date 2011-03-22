_.constructor("Views.ColumnLayout.RankedCandidatesList", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "listContainer"}, function() {
      ol({'class': "rankedCandidatesList"}, function() {

        li({'class': "dragTarget"}, function() {
          span({'class': "dragTargetExplanation"}, function() {
            raw("Drag answers you <em>like</em> here, <br /> with the best at the top.")
          });
        }).ref('goodCandidatesDragTarget');

        li({'class': "separator"}, function() {
          div({'class': "up"}, "good ideas");
          div({'class': "down"}, "bad ideas");
        }).ref('separator');

        li({'class': "dragTarget"}, function() {
          span({'class': "dragTargetExplanation"}, function() {
            raw("Drag answers you <em>dislike</em> here, <br /> with the worst at the bottom.")
          });
        }).ref('badCandidatesDragTarget');

      }).ref('rankedCandidatesList');
      div({'class': "listLoading", style: "display: none"}).ref('loading');
    });
  }},

  // the user's own ranked candidates list has explanations
  dragTargetContent: function() {},

  viewProperties: {

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle();
    },

    rankingsRelation: {
      afterChange: function(rankingsRelation) {
        this.populateRankings();
        this.subscribeToRankingsChanges();
      }
    },

    setupSortable: function() {
      this.rankedCandidatesList.sortable({
        tolerance: "pointer",
        update: this.hitch('handleUpdate'),
        receive: this.hitch('handleReceive'),
        sort: this.hitch('handleSort'),
        helper: 'clone',
        appendTo: this.containingView
      });

      var returnFalse = function(e) { return false; };
      this.separator.mousedown(returnFalse);
      this.goodCandidatesDragTarget.mousedown(returnFalse);
      this.badCandidatesDragTarget.mousedown(returnFalse);
    },

    handleReceive: function(event, ui) {
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var rankedCandidateView = this.findOrCreateRankedLi(candidate).detach(); // may have already been ranked before
      this.findLi(candidate).replaceWith(rankedCandidateView); // replace the clone of the draggable li with a real view
    },

    handleUpdate: function(event, ui) {
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var rankedCandidateLi = this.findRankedLi(candidate);
      Application.currentOrganization().ensureCurrentUserCanParticipate()
        .onSuccess(function() {
          this.showOrHideDragTargets();
          rankedCandidateLi.handleUpdate();
        }, this)
        .onFailure(function() {
          rankedCandidateLi.remove();
        }, this);
    },

    handleSort:  function(event, ui) {
      var placeholder = ui.placeholder;
      var beforeSeparator = placeholder.nextAll(".separator").length === 1;
      if (beforeSeparator && this.goodCandidatesDragTarget.is(":visible")) {
        placeholder.hide();
      } else if (!beforeSeparator && this.badCandidatesDragTarget.is(":visible")) {
        placeholder.hide();
      } else {
        placeholder.show();
      }
    },

    populateRankings: function() {
      this.empty();
      this.rankingsRelation().each(function(ranking) {
        var li = Views.ColumnLayout.RankedCandidateLi.toView({record: ranking.candidate()});
        li.stopLoading();
        if (ranking.position() > 0) {
          this.goodCandidatesDragTarget.hide();
          this.separator.before(li);
        } else {
          this.badCandidatesDragTarget.hide();
          this.rankedCandidatesList.append(li);
        }
      }, this);
    },

    subscribeToRankingsChanges: function() {
      var rankings = this.rankingsRelation();
      this.subscriptions.add(rankings.onRemove(function(ranking) {
        this.findLi(ranking.candidate()).remove();
        this.showOrHideDragTargets();
      }, this));
      this.subscriptions.add(rankings.onInsert(function(ranking, index) {
        this.insertRankedCandidateLi(ranking, index);
      }, this));
      this.subscriptions.add(rankings.onUpdate(function(ranking, changes, index) {
        this.insertRankedCandidateLi(ranking, index);
      }, this));
    },

    insertRankedCandidateLi: function(ranking, index) {
      var li = this.findOrCreateRankedLi(ranking.candidate()).detach();
      if (ranking.position() < 0) index++; // to skip the separator element
      var precedes = this.rankedCandidatesList.children("li.candidate,li.separator").eq(index);
      if (precedes.length > 0) {
        precedes.before(li);
      } else {
        this.rankedCandidatesList.append(li);
      }
      li.stopLoading();
      this.showOrHideDragTargets();
    },

    findOrCreateRankedLi: function(candidate) {
      return this.findRankedLi(candidate) ||
        Views.ColumnLayout.RankedCandidateLi.toView({record: candidate});
    },

    findRankedLi: function(candidate) {
      var previouslyRankedLi = this.rankedCandidatesList.find("li.ranked.candidate[candidateId='" + candidate.id() + "']");
      return previouslyRankedLi.length > 0 ? previouslyRankedLi.view() : null;
    },

    findLi: function(candidate) {
      var li = this.rankedCandidatesList.find("li[candidateId='" + candidate.id() + "']");
      return li.view() ? li.view() : li;
    },

    showOrHideDragTargets: function() {
      if (this.hasPositiveRankings()) {
        this.goodCandidatesDragTarget.hide();
      } else {
        this.goodCandidatesDragTarget.show();
      }
      if (this.hasNegativeRankings()) {
        this.badCandidatesDragTarget.hide();
      } else {
        this.badCandidatesDragTarget.show();
      }
      this.adjustHeight();
    },

    hasPositiveRankings: function() {
      return this.separator.prevAll('.candidate').length > 0;
    },

    hasNegativeRankings: function() {
      return this.separator.nextAll('.candidate').length > 0;
    },

    empty: function() {
      this.rankedCandidatesList.find("li.candidate").each(function() {
        $(this).view().remove();
      });
      this.find('.dragTarget').show();
      this.adjustHeight();
    },

    adjustHeight: function() {
      var dragTargetHeight = (this.height() - this.separator.outerHeight()) / 2;
      this.goodCandidatesDragTarget.height(dragTargetHeight);
      this.badCandidatesDragTarget.height(dragTargetHeight);
    },

    fadeIn: function($super) {
      $super();
      this.adjustHeight();
    },

    afterShow: function() {
      this.adjustHeight();
    },


    startLoading: function() {
      this.empty();
      this.rankedCandidatesList.children().hide();
      this.loading.show();
    },

    stopLoading: function() {
      this.loading.hide();
      this.rankedCandidatesList.children().show();
    }
  }
});