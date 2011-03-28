_.constructor("Views.ColumnLayout.ElectionLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "election recordLi"}, function() {
      span({'class': "body"}).ref("body").click('expand');
      div({'class': "expand icon", style: "display: none;"}).ref('expandIcon');
    }).ref("li").click('showDetails');
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

    showDetails: function() {
      this.containingView.showRecordDetails();
      this.containingView.selectedRecordId(this.election.id());
    }
  }
});