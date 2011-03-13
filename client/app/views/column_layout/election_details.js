_.constructor("Views.ColumnLayout.ElectionDetails", Views.ColumnLayout.RecordDetails, {

  tableName: "elections",
  childLinks: [
    {tableName: "candidates",
     informalName: "Answers"},
    {tableName: "comments",
     informalName: "Comments"},
    {tableName: "votes",
     informalName: "Votes"}
  ],

  viewProperties: {

    recordConstructor: Election,

    childRelationsToFetch: function(record) {
      return [
        Candidate.where({electionId: this.recordId()}),
        ElectionComment.where({electionId: this.recordId()}),
        Vote.where({electionId: this.recordId()})
      ]
    },

    populateChildLinks: function() {

    }
  }
});