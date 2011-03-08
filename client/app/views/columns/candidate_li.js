_.constructor("Views.Columns.CandidateLi", Views.Columns.RecordLi, {
  rootAttributes: {'class': "candidate"},

  tableName: "candidates",

  childTableNames: [
    "comments"
  ],

  expandedContent: function() {with(this.builder) {
  }},

  viewProperties: {

    initialize: function($super) {
      $super();
      this.attr("candidateId", this.record.id());
    },

    createFixedWidthClone: function() {
      var clone = this.clone();
      clone.width(this.width());
      return clone;
    }
  }
});