_.constructor("Views.ColumnLayout.ElectionDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "elections",
  informalTableName: "Questions",
  recordConstructor: Election,
  commentConstructor: ElectionComment,
  informalChildNames: {
    candidates: "Answers",
  },
  childConstructors: {
    candidates: Candidate
  }

});
