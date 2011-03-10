_.constructor("Views.ColumnLayout.Candidates", Views.ColumnLayout.ColumnView, {

  liConstructor: Views.ColumnLayout.UnrankedCandidateLi,
  
  headerContent: function() {with(this.builder) {
    h2("Answers");
  }},
  detailsArea: function() {with(this.builder) {
    subview('detailsArea', Views.ColumnLayout.DetailsArea, {
      rootAttributes: {'class': "detailsArea"}
    });
  }},
  rankedList: function() {with(this.builder) {
    subview('rankedList', Views.ColumnLayout.OwnRankedCandidatesList);
  }},


  viewProperties: {

    relativeWidth: 2,
    
    getMainRelationFromColumnState: function(state) {
      if (state.parentRecordId) {
        return Candidate.where({electionId: state.parentRecordId})
      } else {
        return Candidate.where({id: state.recordId});
      }
    },

    getOtherRelationsFromColumnState: function(state) {
      var candidateRelation = this.getMainRelationFromColumnState(state);
      return [
        candidateRelation.joinThrough(Election),
        candidateRelation.join(User).on(Candidate.creatorId.eq(User.id)),
        candidateRelation.joinThrough(Ranking).where({userId: Application.currentUser().id()})
      ];
    },

    mainRelation: {
      afterChange: function(mainRelation) {
        this.mainList.relation(mainRelation);
        var rankingsRelation = mainRelation.joinThrough(Ranking).
                                 where({userId: Application.currentUser().id()});
        this.rankedList.rankingsRelation(rankingsRelation);
      }
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});
