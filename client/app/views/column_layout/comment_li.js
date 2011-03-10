_.constructor("Views.ColumnLayout.CommentLi", Views.ColumnLayout.RecordLi, {
  rootAttributes: {'class': "comment"},

  tableName: "comments",

  childTableNames: [],

  expandedContent: function() {with(this.builder) {

  }},

  viewProperties: {

    initialize: function($super) {
      $super();
    }

  }
});