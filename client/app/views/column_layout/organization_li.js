_.constructor("Views.ColumnLayout.OrganizationLi", View.Template, {
  content: function() {with(this.builder) {
    li({'class': "recordLi"}, function() {
      div({'class': "expand icon", style: "display: none;"}).ref('expandIcon');
      span({'class': "body"}).ref("body").click('expand');
    }).ref("li").click('select');
  }},

  viewProperties: {

    initialize: function() {
      this.organization = this.organization || this.record;
      this.attr("organizationId", this.organization.id());
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.populateContent();
    },

    populateContent: function() {
      this.body.bindHtml(this.organization, "name");
    },

    select: function() {
      this.containingView.containingColumn.pushState({recordId: this.candidate.id()});
    }
  }
});