_.constructor("Views.ColumnLayout.ElectionLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "unranked recordLi"}, function() {
      div({'class': "icon"}).ref('icon');
      span({'class': "body"}).ref("body");
    }).ref("li").click('select');
  }},

  viewProperties: {

    initialize: function() {
      this.election = this.election || this.record;
      this.attr("electionId", this.election.id());
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.populateContent();
    },

    populateContent: function() {
      this.body.bindHtml(this.election, "body");
    },

    select: function() {
      this.containingView.containingColumn.pushState({recordId: this.election.id()});
    }
  }
});