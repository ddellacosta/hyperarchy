_.constructor("Views.ColumnLayout.DetailsArea", View.Template, {
  content: function(params) {with(this.builder) {
    var record         = params.record;

    div({'class': "detailsArea"}, function() {
      h2({'class': "body"}).ref("body");
      div({'class': "details"}).ref("details");

      div({'class': "creatorInfo"}, function() {
        subview('creatorAvatar', Views.Avatar, { size: 40 });
        div({'class': "creatorName"}, "").ref('creatorName');
        div({'class': "creationDate"}, "").ref('createdAt');
      });

//      ul({'class': "links"}, function() {
//        _(template.childTableNames).each(function(childTableName) {
//          a({'class': "link"}, function() {
//            span({'class': "linkNumber"}).ref(childTableName + "Number");
//            span(_.humanize(childTableName));
//          }).ref(childTableName + "Link").
//             click("showChildTableInNextColumn", childTableName);
//        }, this);
//      }).ref("linksList");
    }).ref("detailsArea");
  }},

  icons: function() {},

  viewProperties: {

    initialize: function() {
      
    },

    record: {
      afterChange: function(record) {
        this.body.bindHtml(record, "body");
        if (this.record.details) {
          this.details.bindHtml(this.record, "details");
        }
        var creator = User.find(record.creatorId());
        this.creatorAvatar.user(creator);
        this.creatorName.html(htmlEscape(creator.fullName()));
        this.createdAt.html(record.formattedCreatedAt());
      }
    },

    showChildTableInNextColumn: function(childTableName) {
      var newStateForNextColumn = {
        tableName:       childTableName,
        recordId:        NaN,
        parentTableName: this.template.tableName,
        parentRecordId:  this.record.id()
      };
      this.containingView.containingColumn.setNextColumnState(newStateForNextColumn);
    }
  }
});