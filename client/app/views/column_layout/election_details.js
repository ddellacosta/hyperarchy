_.constructor("Views.ColumnLayout.ElectionDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "elections",

  recordConstructor: Election,

  childNames: {
    candidates: "Answers"
  },

  childRelations: function(electionId) { return {
    candidates: Candidate.where({electionId: electionId})
  }}
});