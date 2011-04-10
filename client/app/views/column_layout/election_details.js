_.constructor("Views.ColumnLayout.ElectionDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "elections",

  recordConstructor: Election,

  childNames: {
//    comments:   "Comments",
    candidates: "Answers",
    votes:      "Votes"
  },

  childRelations: function(electionId) { return {
//    comments:   ElectionComment.where({electionId: electionId}),
    candidates: Candidate.where({electionId: electionId}),
    votes:      Vote.where({electionId: electionId})
  }}

});