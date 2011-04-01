_.constructor("Views.ColumnLayout.RankedCandidateLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "ranked candidate recordLi"}, function() {
      span({'class': "body"}).ref("body");
      div({'class': "loading icon", style: "display: none;"}).ref('loadingIcon');
      div({'class': "unrank icon", style: "display: none;"}).
        ref('unrankIcon').
        click('unrankCandidate');
    });
  }},

  viewProperties: {

    initialize: function() {
      this.candidate = this.candidate || this.record;
      this.attr("candidateId", this.record.id());
      this.populateContent();

      if (!this.candidate) this.candidate = this.ranking.candidate();
      if (!this.ranking)   this.ranking   = this.candidate.rankingByCurrentUser().first();
      if (this.ranking)    this.rankingPosition = this.ranking.position();
    },

    populateContent: function() {
      this.body.bindHtml(this.record, "body");
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
      var belowSeparator = this.prevAll('.separator').length > 0;
      var successor = this.prevAll('.candidate:first, .separator').view();
      var predecessor = this.nextAll('.candidate:first, .separator').view();
      var successorPosition = successor ? successor.rankingPosition : null;
      var predecessorPosition = predecessor ? predecessor.rankingPosition : null;
      if (belowSeparator) {
        if (!successorPosition) successorPosition = 0;
        if (!predecessorPosition) predecessorPosition = successorPosition - 128;
      } else {
        if (!predecessorPosition) predecessorPosition = 0;
        if (!successorPosition) successorPosition = predecessorPosition + 128;
      }
      return (predecessorPosition + successorPosition) / 2;
    },

    unrankCandidate: function() {
      this.startLoading();
      this.ranking.destroy();
    },

    startLoading: function() {
      this.unrankIcon.hide();
      this.loadingIcon.show();
    },

    stopLoading: function() {
      this.loadingIcon.hide();
      this.unrankIcon.show();
    }
  }
});