_.constructor("Views.ColumnLayout.OwnRankedCandidatesList", Views.ColumnLayout.RankedCandidatesList, {
  viewProperties: {
    initialize: function($super) {
      $super();

      this.goodCandidatesList.sortable({
        connectWith: ".badCandidatesList",
//        update: this.hitch('handleUpdate'),
        receive: this.hitch('handleReceive')
      });
      this.badCandidatesList.sortable({
        connectWith: ".goodCandidatesList",
//        update: this.hitch('handleUpdate'),
        receive: this.hitch('handleReceive')
      });
    },

    handleReceive: function(event, ui) {
      if (ui.item.hasClass("ranked")) return; // if dragged from the other (good or bad) list
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var previouslyRankedLi = this.findPreviouslyRankedLi(candidate); // may have already been ranked before
      var rankedCandidateView = previouslyRankedLi ? previouslyRankedLi.detach() : Views.ColumnLayout.RankedCandidateLi.toView({record: candidate});
      this.findLi(candidate).replaceWith(rankedCandidateView); // replace the clone of the draggable li with a real view
    },


    handleUpdate: function(event, ui) {
//      var candidate = Candidate.find(ui.item.attr('candidateId'));
//      var rankedCandidateLi = this.findLi(candidate);
//      Application.currentOrganization().ensureCurrentUserCanParticipate()
//        .onSuccess(function() {
////          rankedCandidateLi.handleUpdate();
//        }, this)
//        .onFailure(function() {
//          rankedCandidateLi.remove();
//        }, this);
    }
  }
});