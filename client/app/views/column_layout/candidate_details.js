_.constructor("Views.ColumnLayout.CandidateDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "candidates",
  childLinks: [
    {tableName: "comments",
     informalName: "Comments"}
  ],

  viewProperties: {

    recordConstructor: Candidate,

    childRelationsToFetch: function(record) {
      return [
        CandidateComment.where({candidateId: this.recordId()})
      ]
    },

    populateChildLinks: function() {}
  }
});