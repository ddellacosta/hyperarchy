_.constructor("Views.ColumnLayout.CandidatesView", Views.ColumnLayout.ExpandableRecordsView, {

  tableName: "candidates",
  liTemplate:      Views.ColumnLayout.UnrankedCandidateLi,
  detailsTemplate: Views.ColumnLayout.CandidateDetails,

  leftHeader: function() {with(this.builder) {
    h2("Answers");
  }},

  additionalRightContent: function() {with(this.builder) {
    subview('rankedList', Views.ColumnLayout.RankedCandidatesList, {});
  }},

  viewProperties: {

    initialize: function($super) {
      $super();
      this.rankedList.containingView = this;
      this.rankedList.setupSortable();
    },

    mainRelationToFetch: function(state) {
      if (state.parentRecordId) {
        return Candidate.where({electionId: state.parentRecordId})
      } else {
        return Candidate.where({id: state.recordId});
      }
    },

    otherRelationsToFetch: function(candidatesRelation) {
      return [
        candidatesRelation.join(User).on(Candidate.creatorId.eq(User.id)),
        candidatesRelation.joinThrough(Election),
        candidatesRelation.joinThrough(Ranking).where({userId: Application.currentUser().id()})
      ];
    },

    mainRelation: {
      afterChange: function(candidatesRelation) {
        this.unrankedList.relation(candidatesRelation);
        var rankingsRelation = candidatesRelation.joinThrough(Ranking).
                               where({userId: Application.currentUser().id()});
        this.rankedList.rankingsRelation(rankingsRelation.orderBy(Ranking.position.desc()));
      }
    },

    showRankedList: function() {
      this.header.show();
      this.rightSection.children().hide();
      this.rankedList.show();
    },

    adjustHeight: function($super) {
      $super();
      this.rankedList.adjustHeight();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});