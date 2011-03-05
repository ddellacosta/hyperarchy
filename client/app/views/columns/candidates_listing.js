_.constructor("Views.Columns.CandidatesListing", Views.Columns.RecordsColumn, {

  liConstructor: Views.Columns.CandidateLi,

  headerContent: function() { with(this.builder) {
    h2("Answers");
  }},

  rightSubColumn: function() { with(this.builder) {
    subview('rankedCandidatesList', Views.Columns.RankedCandidatesList, {
      rootAttributes: {'class': "candidatesList ranked"}
    });
  }},

  rootAttributes: {'class': "candidates"},

  viewProperties: {

    relativeWidth: 2,
    
    mainRelationForState: function(state) {
      if (state.parentRecordId) {
        return Candidate.where({electionId: state.parentRecordId})
      } else {
        return Candidate.where({id: state.recordId});
      }
    },

    additionalRelationsForState: function(state) {
      var candidateRelation = this.mainRelationForState(state);
      return [
        candidateRelation.joinThrough(Election),
        candidateRelation.joinThrough(Ranking),
        candidateRelation.join(User).on(Candidate.creatorId.eq(User.id))
      ];
    },

    populateBody: function(mainRelation) {
      this.mainList.relation(mainRelation);
    }
  }
});
