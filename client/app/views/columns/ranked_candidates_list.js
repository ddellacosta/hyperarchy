_.constructor("Views.Columns.RankedCandidatesList", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "rankedCandidatesList"}, function() {
      ol({'class': "goodCandidatesList"}, function() {
        div({'class': "dragTargetExplanation"}, function() {
          raw("Drag answers you <em>like</em> here, <br /> with the best at the top.")
        }).ref('goodCandidatesExplanation');
      }).ref("goodCandidatesList");

      div({'class': "separator"}, function() {
        div({'class': "up"}, "good ideas");
        div({'class': "down"}, "bad ideas");
      }).ref('separator');

      ol({'class': "badCandidatesList"}, function() {
        div({'class': "dragTargetExplanation"}, function() {
          raw("Drag answers you <em>dislike</em> here, <br /> with the worst at the bottom.")
        }).ref('badCandidatesExplanation');
      }).ref('badCandidatesList');
    }).ref('rankedCandidatesList');
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
      this.goodCandidatesList.empty();
      this.badCandidatesList.empty();

      this.rankingsRelation().each(function(ranking) {
        var candidate = Candidate.find(ranking.candidateId());
        var li = Views.Columns.RankedCandidateLi.toView({record: candidate});
        if (ranking.position() > 0) {
          this.goodCandidatesExplanation.hide();
          this.goodCandidatesList.append(li);
        } else {
          this.badCandidatesExplanation.hide();
          this.badCandidatesList.append(li);
        }
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

    findLi: function(candidate) {
      var li = this.rankedCandidatesList.find("li[candidateId='" + candidate.id() + "']");
      return li.view() ? li.view() : li;
    },

    findPreviouslyRankedLi: function(candidate) {
      var previouslyRankedLi = this.rankedCandidatesList.find("li.ranked.candidate[candidateId='" + candidate.id() + "']");
      return previouslyRankedLi.length > 0 ? previouslyRankedLi.view() : null;
    },

    adjustHeight: function() {
      this.goodCandidatesList.css('height', this.height() / 2 - 15);
      this.badCandidatesList.css('height', this.height() / 2  - 15);
    }
  }
});