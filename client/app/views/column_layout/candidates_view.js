_.constructor("Views.ColumnLayout.CandidatesView", Views.ColumnLayout.ExpandableRecordsView, {

  tableName: "candidates",
  liTemplate:      Views.ColumnLayout.UnrankedCandidateLi,
  detailsTemplate: Views.ColumnLayout.CandidateDetails,

  headerContent: function() {with(this.builder) {
    h2("Answers");
  }},

  additionalBodyContent: function() {with(this.builder) {
    subview('rankedList', Views.ColumnLayout.OwnRankedCandidatesList, {});
  }},

  viewProperties: {

    initialize: function($super) {
      $super();
      this.rankedList.containingView = this;
      this.rankedList.setupSortable();
    },

    relativeWidth: 2,

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
        this.mainList.relation(candidatesRelation);
        var rankingsRelation = candidatesRelation.joinThrough(Ranking).
                               where({userId: Application.currentUser().id()});
        this.rankedList.rankingsRelation(rankingsRelation.orderBy(Ranking.position.desc()));
      }
    },

    showMainListAndRankedList: function() {
      this.header.show();
      this.mainList.removeClass('columnRight columnFull');
      this.mainList.addClass('columnLeft');
      this.rankedList.removeClass('columnLeft columnFull');
      this.rankedList.addClass('columnRight');
      this.body.children().hide();
      this.mainList.show();
      this.rankedList.show();
    },

    adjustHeight: function() {
      this.body.fillContainingVerticalSpace(20);
      this.rankedList.adjustHeight();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});