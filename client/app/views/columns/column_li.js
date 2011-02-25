_.constructor("Views.ColumnLi", View.Template, {
  content: function() { with(this.builder) {
    li({'class': "column"}).ref("body");
  }},

  viewProperties: {

    initialize: function() {
      this.views = {
//        organizations: Views.Columns.OrganizationsColumn.toView(),
//        elections:     Views.Columns.ElectionsColumn.toView(),
//        candidates:    Views.Columns.CandidatesColumn.toView(),
//        comments:      Views.Columns.CommentsColumn.toView(),
//        votes:         Views.Columns.VotesColumn.toView(),
        default:       Views.Columns.RecordsColumn.toView()
      };
      _(this.views).each(function(view) {
        view.hide();
        this.body.append(view);
      }, this);
    },

    state: {
      afterChange: function(columnState) {
        var view = this.views[columnState.tableName] || this.views.default; // temporary default
        view.state(columnState);
        this.currentView(view);
      }
    },

    currentView: {
      afterChange: function(currentView) {
        _(this.views).each(function(view) {
          view.hide();
        });
        currentView.show();
      }
    },

    relativeWidth: function() {
      return this.currentView().RELATIVE_WIDTH || 1;
    }
  }
});
