_.constructor("Views.ColumnLayout.CandidateLi", Views.ColumnLayout.RecordLi, {
  rootAttributes: {'class': "candidate"},

  viewProperties: {

    initialize: function($super) {
      $super();
      this.attr("candidateId", this.record.id());
    }
  }
});