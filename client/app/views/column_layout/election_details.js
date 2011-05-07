_.constructor("Views.ColumnLayout.ElectionDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "elections",
  recordConstructor: Election,
  commentConstructor: ElectionComment,
  childNames: {
    candidates: "Answers",
  },
  childConstructors: {
    candidates: Candidate
  }

});
