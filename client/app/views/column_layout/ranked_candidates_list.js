_.constructor("Views.ColumnLayout.RankedCandidatesList", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "rankedCandidatesList"}, function() {
      ol({'class': "goodCandidatesList"}, function() {
        span({'class': "dragTargetExplanation", style: "display: none;"}, function() {
          raw("Drag answers you <em>like</em> here, <br /> with the best at the top.");
        }).ref('goodCandidatesExplanation');
      }).ref("goodCandidatesList");
      div({'class': "separator"}, function() {
        div({'class': "up"}, "good ideas");
        div({'class': "down"}, "bad ideas");
      }).ref('separator');

      ol({'class': "badCandidatesList"}, function() {
        span({'class': "dragTargetExplanation", style: "display: none;"}, function() {
          raw("Drag answers you <em>dislike</em> here, <br /> with the worst at the bottom.");
        }).ref('badCandidatesExplanation');
      }).ref('badCandidatesList');
    });
  }},

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
        var candidate = Candidate.find(ranking.candidateId());
        var li = Views.ColumnLayout.RankedCandidateLi.toView({record: candidate});
        var list = (ranking.position() > 0) ? this.goodCandidatesList : this.badCandidatesList;
        list.append(li);
      }, this);
    },

    subscribeToRankingsChanges: function() {
      var rankings = this.rankingsRelation();
      this.subscriptions.add(rankings.onInsert(function(ranking, index) {
        this.insertRankedCandidateLi(ranking, index);
      }, this));
      this.subscriptions.add(rankings.onUpdate(function(ranking, changes, index) {
        this.insertRankedCandidateLi(ranking, index);
      }, this));
      this.subscriptions.add(rankings.onRemove(function(ranking) {
        this.findLi(ranking.candidate()).remove();
      }, this));
    },

    insertRankedCandidateLi: function(ranking, index) {
      var li = this.findOrCreateRankedCandidateLi(ranking.candidate()).detach();
      var containingList, nextLi;
      if (ranking.position() > 0) {
        nextLi = this.goodCandidatesList.find('li.candidate').eq(index);
        containingList = this.goodCandidatesList;
      } else {
        nextLi = this.find("li.candidate").eq(index);
        containingList = this.badCandidatesList;
      }
      if (nextLi.length > 0) li.insertBefore(nextLi);
      else                   li.appendTo(containingList);
      li.stopLoading();
      this.showOrHideDragTargetExplanations();
    },

    findOrCreateRankedCandidateLi: function(candidate) {
      return this.findPreviouslyRankedLi(candidate) ||
             Views.ColumnLayout.RankedCandidateLi.toView({record: candidate});
    },

    findPreviouslyRankedLi: function(candidate) {
      var li = this.find("li.ranked[candidateId='" + candidate.id() + "']");
      return li.length > 0 ? li.view() : null;
    },

    findLi: function(candidate) {
      var li = this.find("li[candidateId='" + candidate.id() + "']");
      return li.view() ? li.view() : li;
    },

    showOrHideDragTargetExplanations: function() {
      if (this.hasPositiveRankings()) {
        this.goodCandidatesExplanation.hide();
      } else {
        this.goodCandidatesExplanation.show();
      }
      if (this.hasNegativeRankings()) {
        this.badCandidatesExplanation.hide();
      } else {
        this.badCandidatesExplanation.show();
      }
    },

    hasPositiveRankings: function() {
      return this.goodCandidatesList.find('.candidate').length > 0;
    },

    hasNegativeRankings: function() {
      return this.badCandidatesList.find('.candidate').length > 0;
    },

    empty: function() {
      this.goodCandidatesList.find('li.candidate').remove();
      this.badCandidatesList.find('li.candidate').remove();
      this.defer(this.hitch('showOrHideDragTargetExplanations'));
    },

    adjustHeight: function() {
      this.fillContainingVerticalSpace();
      var height = (this.height() - 28) / 2;
      this.goodCandidatesList.css('height', height);
      this.badCandidatesList.css('height', height);
    },

    afterShow: function() {
      this.adjustHeight();
    }
  }
});