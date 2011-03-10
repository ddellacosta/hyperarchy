_.constructor("Views.ColumnLayout.CandidateLi", Views.ColumnLayout.RecordLi, {
  rootAttributes: {'class': "candidate"},

  tableName: "candidates",

  childTableNames: [
    "comments"
  ],

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