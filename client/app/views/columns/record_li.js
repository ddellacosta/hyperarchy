_.constructor("Views.Columns.RecordLi", View.Template, {
  content: function(params) {with(this.builder) {
    var record         = params.record;
    var rootAttributes = template.rootAttributes || {};
    li(rootAttributes, function() {

      a({'class': "body"}).ref("body").click('expandOrContract');
      template.icons();

      div({style: "display: none;", 'class': "expandedAreaSpacer"}).ref('expandedAreaSpacer');
      div({style: "display: none;"}, function() {
        template.expandedContent();

        div({'class': "creatorInfo"}, function() {
          subview('creatorAvatar', Views.Avatar, { size: 40 });
          div({'class': "details"}, function() {
            div({'class': "name"}, "").ref('creatorName');
            div({'class': "date"}, "").ref('createdAt');
          });
          div({'class': "clear"});
        });

        ul({'class': "links"}, function() {
          _(template.childTableNames).each(function(childTableName) {
            a({'class': "link"}, function() {
              span({'class': "linkNumber"}).ref(childTableName + "Number");
              span(_.humanize(childTableName));
            }).ref(childTableName + "Link").
               click("showChildTableInNextColumn", childTableName);
          }, this);
        }).ref("linksList");
      }).ref("expandedArea");

    }).ref("li");
  }},

  icons: function() {},

  viewProperties: {

    initialize: function() {
      this.body.bindHtml(this.record, "body");
      User.findOrFetch(this.record.creatorId())
        .onSuccess(function(creator) {
          this.creatorAvatar.user(creator);
          this.creatorName.html(htmlEscape(creator.fullName()));
          this.createdAt.html(this.record.formattedCreatedAt());
          this.show();
        }, this);
    },

    expandOrContract: function() {
      if (this.expanded) {
        this.contract();
      } else {
        this.expand();
      }
    },

    expand: function() {
      if (this.expanded) return;
      this.expanded = true;
      this.expandedArea.slideDown(20, this.bind(function() {
        this.addClass("expanded")
      }));
    },

    contract: function() {
      if (!this.expanded) return;
      this.expanded = false;
      this.expandedArea.slideUp(20, this.bind(function() {
        this.removeClass("expanded");
      }));
    },

    showChildTableInNextColumn: function(childTableName) {
      var newStateForNextColumn = {
        tableName:       childTableName,
        recordId:        NaN,
        parentTableName: this.template.tableName,
        parentRecordId:  this.record.id()
      };
      this.containingListing.containingColumn.setNextColumnState(newStateForNextColumn);
    }
  }
});