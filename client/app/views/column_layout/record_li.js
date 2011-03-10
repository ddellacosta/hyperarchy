_.constructor("Views.ColumnLayout.RecordLi", View.Template, {
  content: function(params) {with(this.builder) {
    var record         = params.record;
    var rootAttributes = template.rootAttributes || {};
    li(rootAttributes, function() {
      span({'class': "body"}).ref("body").click('expand');
      template.icons();
    }).ref("li");
  }},

  icons: function() {},

  viewProperties: {

    initialize: function() {
      this.body.bindHtml(this.record, "body");
    },

    expand: function() {
      this.containingView.detailsArea.record(this.record);
      this.containingView.showDetailsArea();
      this.addClass("expanded");
    }
  }
});