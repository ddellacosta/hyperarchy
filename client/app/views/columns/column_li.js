_.constructor("Views.Columns.ColumnLi", View.Template, {
  content: function() {
    this.builder.tag("li", {'class': "column"}).ref("body");
  },

  viewProperties: {

    initialize: function() {
      this.views = {
        organizations: Views.Columns.Organizations.toView({containingColumn: this}),
        votes:         Views.Columns.Votes.toView({containingColumn: this}),
        elections:     Views.Columns.Elections.toView({containingColumn: this}),
        candidates:    Views.Columns.Candidates.toView({containingColumn: this}),
        comments:      Views.Columns.Comments.toView({containingColumn: this})
      };

      _(this.views).each(function(view) {
        view.hide();
        view.appendTo(this.body);
      }, this);
    },

    state: {
      afterChange: function(columnState) {
        if (!columnState) return;
        var viewName = columnState.tableName;
        this.switchToView(viewName);
        this.currentView.state(columnState);
      }
    },

    getViewNameFromColumnState: function(state) {
      return state.tableName;
    },

    setNextColumnState: function(state) {
      var columnNumber     = this.columnNumber();
      var lastColumnNumber = this.containingList.numVisibleColumns() - 1;
      if (columnNumber === lastColumnNumber) {
        this.containingList.scrollRightAndSetRightColumnState(state);
      } else {
        var nextColumn = this.containingList.visibleColumns[columnNumber + 1];
        this.containingList.setColumnState(nextColumn, state);
      }
    },

    setPreviousColumnState: function(state) {
      var columnNumber = this.columnNumber();
      if (columnNumber === 0) {
        this.containingList.scrollLeft(state);
      } else {
        this.containingList.setColumnState(columnNumber - 1, state);
      }
    },

    handleInvalidColumnState: function() {
      console.debug("invalid url hash");
      // redirect somewhere
    },

    switchToView: function(viewName) {
      if (! this.views[viewName]) this.handleInvalidColumnState();
      _(this.views).each(function(view, name) {
        if (name === viewName) view.show();
        else view.hide();
      });
      this.currentView = this.views[viewName];
    },

    columnNumber: {
      afterChange: function() {}
    }
  }
});
