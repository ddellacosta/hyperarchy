_.constructor("Views.ColumnLayout.RankedCandidateLi", Views.ColumnLayout.CandidateLi, {

  rootAttributes: {'class': "ranked candidate"},

  icons: function() { with(this.builder) {
    div({'class': "liIcons"}, function() {
      div({'class': "unrankCandidate", style: "display: none;"})
        .ref('destroyRankingButton')
        .click('destroyRanking');
      div({'class': "loadingIcon", style: "display: none;"}).ref("loadingIcon");
    });
  }},

  viewProperties: {
    initialize: function($super) {
      $super();
      if (!this.record) this.record = this.ranking.candidate();
      if (!this.ranking) this.ranking = this.record.rankingByCurrentUser().first();
      if (this.ranking) this.rankingPosition = this.ranking.position();
    },

    handleUpdate: function() {
      this.startLoading();
      var rankingPosition = this.determineRankingPosition();
      this.rankingPosition = rankingPosition;
      Ranking.createOrUpdate(Application.currentUser(), this.record, this.rankingPosition)
        .onSuccess(function(ranking) {
          this.ranking = ranking;
          if (rankingPosition === this.rankingPosition) this.stopLoading();
        }, this);
    },

    determineRankingPosition: function() {
      var positivelyRanked = this.parent().hasClass('goodCandidatesList');
      var successor = this.prevAll('.candidate:first').view();
      var predecessor = this.nextAll('.candidate:first').view();
      var successorPosition = successor ? successor.rankingPosition : null;
      var predecessorPosition = predecessor ? predecessor.rankingPosition : null;
      if (positivelyRanked) {
        if (!predecessorPosition) predecessorPosition = 0;
        if (!successorPosition) successorPosition = predecessorPosition + 128;
      } else {
        if (!successorPosition) successorPosition = 0;
        if (!predecessorPosition) predecessorPosition = successorPosition - 128;
      }
      return (predecessorPosition + successorPosition) / 2;
    },

    destroyRanking: function() {
      this.startLoading();
      this.ranking.destroy();
    },

    startLoading: function() {
      this.destroyRankingButton.hide();
      this.loadingIcon.show();
    },

    stopLoading: function() {
      this.loadingIcon.hide();
      this.destroyRankingButton.show();
    }
  }
});