_.constructor("Views.ColumnLayout.ElectionDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "elections",

  recordConstructor: Election,

  childNames: {
    candidates: "Answers",
    comments:   "Comments"
  },

  childRelations: function(electionId) { return {
    candidates: Candidate.where({electionId: electionId}),
    comments:   ElectionComment.where({electionId: electionId})
  }}
});
