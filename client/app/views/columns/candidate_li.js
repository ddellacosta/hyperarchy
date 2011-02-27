_.constructor("Views.Columns.CandidateLi", Views.Columns.RecordLi, {
  rootAttributes: {'class': "candidate"},

  tableName: "candidates",

  childTableNames: [
    "comments"
  ],

  expandedContent: function() {with(this.builder) {
  }},

  viewProperties: {

  }
  
});