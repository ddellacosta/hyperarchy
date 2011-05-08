_.constructor("Views.ColumnLayout.CandidateDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "candidates",
  informalTableName: "Answers",
  recordConstructor: Candidate,
  commentConstructor: CandidateComment,
  informalChildNames: {},
  childConstructors: {}

});
