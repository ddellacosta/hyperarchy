_.constructor("Views.ColumnLayout.ElectionLi", Views.ColumnLayout.RecordLi, {
  rootAttributes: {'class': "election"},

  icons: function() {with(this.builder) {
    div({'class': "liIcons"}, function() {
      div({'class': "expandIcon", style: "display: none;"}).ref('expandIcon');
    });
  }}
});