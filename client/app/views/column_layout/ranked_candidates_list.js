_.constructor("Views.ColumnLayout.RankedCandidatesList", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "listContainer"}, function() {
      ol({'class': "rankedCandidatesList"}, function() {

        li({'class': "dragTarget"}, function() {
          template.dragTargetContent()
        }).ref('goodCandidatesDragTarget');

        li({'class': "separator"}, function() {
          div({'class': "up"}, "good ideas");
          div({'class': "down"}, "bad ideas");
        }).ref('separator');

        li({'class': "dragTarget"}, function() {
          template.dragTargetContent()
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