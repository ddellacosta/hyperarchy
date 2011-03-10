_.constructor("Views.ColumnLayout.ColumnLi", View.Template, {
  content: function() {
    this.builder.tag("li", {'class': "column"});
  },

  viewProperties: {

    initialize: function() {
      this.views = {
        organizations: Views.ColumnLayout.Organizations.toView(),
        votes:         Views.ColumnLayout.Votes.toView(),
        elections:     Views.ColumnLayout.Elections.toView(),
        candidates:    Views.ColumnLayout.Candidates.toView(),
        comments:      Views.ColumnLayout.Comments.toView()
      };

      _(this.views).each(function(view) {
        this.append(view.hide());
      }, this);
    },

    state: {
      afterChange: function(columnState, oldState) {
        if (!columnState || _(columnState).isEqual(oldState)) return;
        var viewName = columnState.tableName;
        this.switchToView(viewName);
        this.currentView.state(columnState);
      }
    },

    switchToView: function(viewName) {
      this.currentView = this.views[viewName];
      if (! this.currentView) this.handleInvalidState(this.state());
      this.children().hide();
      this.currentView.show();
    },

    setNextColumnState: function(newStateForNextColumn) {
      var newStateForThisColumn = _.clone(this.state());
      newStateForThisColumn.recordId = newStateForNextColumn.parentRecordId;
      this.state(newStateForThisColumn);

      var columnNumber     = this.columnNumber();
      var lastColumnNumber = this.containingList.numVisibleColumns() - 1;
      if (columnNumber === lastColumnNumber) {
        this.containingList.scrollRightAndSetRightColumnState(newStateForNextColumn);
      } else {
        var nextColumn = this.containingList.visibleColumns[columnNumber + 1];
        this.containingList.setColumnState(nextColumn, newStateForNextColumn);
      }
    },

    columnNumber: {
      afterChange: function(columnNumber) {
        this.currentView.containingColumnNumber(columnNumber);
      }
    },

    handleInvalidState: function(state) {
      this.containingList.handleInvalidState(state);
    }
  }
});
