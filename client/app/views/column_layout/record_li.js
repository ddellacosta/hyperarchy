_.constructor("Views.ColumnLayout.RecordLi", View.Template, {
  content: function(params) {with(this.builder) {
    var rootAttributes = template.rootAttributes || {};
    li(rootAttributes, function() {
      a({'class': "body"}).ref("body").click('expand');
      div({'class': "expandIcon"}).ref("expandIcon");
      template.additionalIcons();
    }).ref("li");
  }},

  // template properties to override:
  additionalIcons: function() {},

  viewProperties: {

    initialize: function() {
      this.body.bindHtml(this.record, "body");
    },

    expand: function() {
      this.containingView.showMainListAndDetailsArea();
      this.containingView.selectedRecordId(this.record.id());
    }
  }
});