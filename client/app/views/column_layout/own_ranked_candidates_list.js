_.constructor("Views.ColumnLayout.OwnRankedCandidatesList", Views.ColumnLayout.RankedCandidatesList, {

  dragTargetContent: function() {with(this.builder) {
    span({'class': "dragTargetExplanation"}, function() {
      raw("Drag answers you <em>like</em> here, <br /> with the best at the top.")
    });
  }},

  viewProperties: {

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
    }
  }
});