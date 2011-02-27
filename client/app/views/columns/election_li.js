_.constructor("Views.Columns.ElectionLi", Views.Columns.RecordLi, {
  rootAttributes: {'class': "election"},

  tableName: "elections",

  childTableNames: [
    "candidates",
    "comments"
  ],

  expandedContent: function() {with(this.builder) {
    div().ref("details");
  }},


  viewProperties: {

    initialize: function($super) {
      $super();
//      this.details.bindHtml(this.record, "details");
    }

  }
});