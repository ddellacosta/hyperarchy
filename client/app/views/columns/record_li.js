_.constructor("Views.Columns.RecordLi", View.Template, {
  content: function(params) {with(this.builder) {
    var record         = params.record;
    var rootAttributes = template.rootAttributes || {};

    li(rootAttributes, function() {

      div({'class': "expandArrow"}).
        ref("expandArrow").
        click('expandOrContract');
      div({'class': "body"}).ref("body");
      div({'class': "creator"}).ref("creator");
      div({'class': "createdAt"}).ref("createdAt");

      div({style: "display: none;", 'class': "expandedAreaSpacer"}).ref('expandedAreaSpacer');

      div({style: "display: none;"}, function() {
        template.expandedContent();

        ul({'class': "links"}, function() {
          _(template.childTableNames).each(function(childTableName) {
            li(function() { a(function() {
              span({'class': "linkNumber"}).ref(childTableName + "Number");
              span(_.humanize(childTableName));
            })}).
              ref(childTableName + "Link").
              click("showChildTableInNextColumn", childTableName);
          }, this);
        }).ref("linksList");

      }).ref("expandedArea");
    });
  }},

  viewProperties: {

    initialize: function() {
      this.body.bindHtml(this.record, "body");


      User.findOrFetch(this.record.creatorId())
        .onSuccess(function(creator) {
          this.creator.html(htmlEscape(creator.fullName()));
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
      this.expandArrow.addClass('expanded');
      this.addClass("expanded")
      this.expandedArea.slideDown(20, function() {

      });
    },

    contract: function() {
      if (!this.expanded) return;
      this.expanded = false;
      this.expandedArea.slideUp(20, this.bind(function() {
        this.expandArrow.removeClass('expanded');
        this.removeClass("expanded");
      }));
    },

    showChildTableInNextColumn: function(childTableName) {
      var state = {
        tableName:       childTableName,
        parentTableName: this.template.tableName,
        parentRecordId:  this.record.id()
      };
      this.containingView.containingColumn.setNextColumnState(state);
    }
  }
});