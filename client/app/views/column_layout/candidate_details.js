_.constructor("Views.ColumnLayout.CandidateDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "candidates",

  recordConstructor: Candidate,

  childNames: {
    comments:   "Comments"
  },

  childRelations: function(candidateId) { return {
    comments:   CandidateComment.where({candidateId: candidateId})
  }}

});