_.constructor("Views.ColumnLayout.RecordDetails", View.Template, {
  content: function() {with(this.builder) {
    div({'class': _.singularize(template.tableName)+"Details"}, function() {
      h2({'class': "body"}).ref("body");
      div({'class': "details"}).ref("details");

      div({'class': "creatorInfo"}, function() {
        subview('creatorAvatar', Views.Avatar, { size: 40 });
        div({'class': "creatorName"}, "").ref('creatorName');
        div({'class': "creationDate"}, "").ref('createdAt');
      });

      ul({'class': "childLinks"}, function() {
        _(template.childLinks).each(function(link) {
          a({'class': "childLink"}, function() {
            span().ref(link.tableName + "Number");
            span().ref(link.tableName + "Text");
          }).ref(link.tableName + "Link").
             click("showChildTableInNextColumn", link.tableName);
        }, this);
      }).ref("childLinksList");
    });
  }},

  // template properties to override:
  tableName: "records",
  childLinks: [
    {tableName: null,
     informalName: null}
  ],

  viewProperties: {

    // view properties to override:
    recordConstructor: null,
    childRelationsToFetch: function(record) {return []},
    populateChildLinks: function() {},


    // shared view properties
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    recordId: {
      afterChange: function(id) {
        var record = this.recordConstructor.find(id);
        this.record(record);
      }
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

        var childRelations = this.childRelationsToFetch(record);
        Server.fetch(childRelations).onSuccess(function() {
          this.populateChildLinks();
        }, this)
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