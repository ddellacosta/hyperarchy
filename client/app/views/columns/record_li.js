_.constructor("Views.Columns.RecordLi", View.Template, {
  content: function() { with(this.builder) {
    li({'class': "recordLi"}, function() {
      div({'class': "topArea"}, function() {
        div({'class': "expandArrow"})
          .ref('expandArrow')
          .click('expandOrContract');
        div({'class': "loading", style: "display: none;"}).ref('loadingIcon');
        div({'class': "body"}).ref('body');
      });

      div({'class': "expandedArea", style: "display: none;"}, function() {
        a("Comments").ref("commentsLink");
      }).ref("expandedArea");
    });
  }},

  viewProperties: {
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.body.html(this.record.id() + " " + this.record.body());
      var record = this.record;

      this.commentsLink.click(function() {
        Application.views.columns.scrollRight({
          parentTableName: this.state().tableName,
          parentId:        this.state().selectedId,
          tableName:       "comments"
        });
      });
    },

    afterRemove: function() {
      this.subscriptions.destroy();
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
      this.expandedArea.show();
    },

    contract: function() {
      if (!this.expanded) return;
      this.expanded = false;
      this.expandArrow.removeClass('expanded');
      this.expandedArea.hide();
    },

    destroyRecord: function() {
      this.startLoading();
      this.record.destroy()
        .onSuccess(function() {
          this.stopLoading();
        }, this);
    },

    startLoading: function() {
      this.loadingIcon.show();
    },

    stopLoading: function() {
      this.loadingIcon.hide();
    }
  }
});