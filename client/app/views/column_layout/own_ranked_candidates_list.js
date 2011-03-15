_.constructor("Views.ColumnLayout.OwnRankedCandidatesList", Views.ColumnLayout.RankedCandidatesList, {

  viewProperties: {

    setupSortable: function() {
      this.goodCandidatesList.sortable({
        connectWith: ".badCandidatesList",
        items: 'li.candidate',
        helper: 'clone',
        appendTo: this.containingView,
        update: this.hitch('handleUpdate'),
        receive: this.hitch('handleReceive'),
        remove: this.hitch('handleRemove')
      });
      this.badCandidatesList.sortable({
        connectWith: ".goodCandidatesList",
        items: 'li.candidate',
        helper: 'clone',
        appendTo: this.containingView,
        update: this.hitch('handleUpdate'),
        receive: this.hitch('handleReceive'),
        remove: this.hitch('handleRemove')
      });
    },

    handleReceive: function(event, ui) {
      // replace the clone with a real view
      if (ui.item.hasClass('ranked')) return;
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var rankedCandidateView = this.findOrCreateRankedCandidateLi(candidate).detach();
      this.findLi(candidate).replaceWith(rankedCandidateView);
      this.defer(this.hitch('showOrHideDragTargetExplanations'));
    },

    handleRemove: function() {
      this.defer(this.hitch('showOrHideDragTargetExplanations'));
    },

    handleUpdate: function(event, ui) {
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var rankedCandidateLi = this.findLi(candidate);
      Application.currentOrganization().ensureCurrentUserCanParticipate()
        .onSuccess(function() {
          rankedCandidateLi.handleUpdate();
        }, this)
        .onFailure(function() {
          rankedCandidateLi.remove();
        }, this);
    }
  }
});