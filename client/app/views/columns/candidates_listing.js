_.constructor("Views.Columns.CandidatesListing", Views.Columns.RecordsListing, {

  liConstructor: Views.Columns.UnrankedCandidateLi,

  headerContent: function() { with(this.builder) {
    h2("Answers");
  }},

  additionalBodyContent: function() { with(this.builder) {
    subview('rankedCandidatesList', Views.Columns.OwnRankedCandidatesList, {
      rootAttributes: {'class': "candidatesList ranked"}
    });
  }},

  rootAttributes: {'class': "candidates"},
  listAttributes: {'class': "candidatesList"},

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
        candidateRelation.join(User).on(Candidate.creatorId.eq(User.id)),
        candidateRelation.joinThrough(Ranking).where({userId: Application.currentUser().id()})
      ];
    },

    mainRelation: {
      afterChange: function(mainRelation) {
        this.mainList.relation(mainRelation);
        var rankingsRelation = mainRelation.joinThrough(Ranking).
                                 where({userId: Application.currentUser().id()});
        this.rankedCandidatesList.rankingsRelation(rankingsRelation);
      }
    }
  }
});
