_.constructor("Views.ColumnLayout.ElectionLi", Views.ColumnLayout.RecordLi, {
  rootAttributes: {'class': "election"},

  tableName: "elections",

  childTableNames: [
    "candidates",
    "comments"
  ],

  viewProperties: {

    initialize: function($super) {
      $super();
    }
  }
});