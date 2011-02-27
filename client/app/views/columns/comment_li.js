_.constructor("Views.Columns.CommentLi", Views.Columns.RecordLi, {
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