_.constructor("Views.Columns.ColumnsList", View.Template, {
  content: function() {
    this.builder.tag("ol", {id: "columns"}).ref("body");
  },

  viewProperties: {
    viewName:    'columns',
    defaultView:  true,

    MAX_VISIBLE_COLUMNS:   3,
    MIN_INVISIBLE_COLUMNS: 3,

    initialize: function() {
      this.visibleColumns   = [];
      this.invisibleColumns = [];
      this.numColumns = this.MAX_VISIBLE_COLUMNS + this.MIN_INVISIBLE_COLUMNS;
      for (var i = 0; i < this.numColumns; i++) {
        this.invisibleColumns[i] = Views.Columns.ColumnLi.toView();
        this.invisibleColumns[i].containingList = this;
      }
    },

    navigate: function(state) {
      if (this.nextStateIsAlreadySetUp) {
        this.nextStateIsAlreadySetUp = false;
        return;
      }
      var columnStates = this.getColumnStatesFromUrlState(state);
      this.numVisibleColumns(columnStates.length);
      _(this.visibleColumns).each(function(column, i) {
        column.state(columnStates[i]);
      }, this);
      this.arrangeColumns();
      this.setCurrentOrganizationId();

      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.hideSubNavigationContent();
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      var recordId, tableName, parentRecordId, parentTableName;
      for (var i = 0; i < this.MAX_VISIBLE_COLUMNS; i++) {
        tableName       = state["col" + (i+1)];
        parentTableName = state["col" + i];
        recordId        = parseInt(state["id" + (i+1)]);
        parentRecordId  = parseInt(state["id" + i]);
        if (!tableName || !(recordId || (parentTableName && parentRecordId))) break;
        columnStates[i] = {
          tableName:       tableName,
          parentTableName: parentTableName,
          recordId:        recordId,
          parentRecordId:  parentRecordId
        };
      }
      return columnStates;
    },

    getUrlStateFromColumnStates: function() {
      var urlState = {};
      _(this.visibleColumns).each(function(column, i) {
        urlState["col" + (i+1)]         = column.state().tableName;
        if (i > 0) urlState["id" + (i)] = column.state().parentRecordId;
      });
      return urlState;
    },

    scrollLeft: function(columnState) {
      var newFirstColumn  = this.invisibleColumns.pop();
      var oldLastColumn = this.visibleColumns.pop();

      this.visibleColumns.unshift(newFirstColumn);
      this.invisibleColumns.unshift(oldLastColumn);
      newFirstColumn.css({marginLeft: "-1000px"});
      newFirstColumn.prependTo(this.body);
      newFirstColumn.animate({
        marginLeft: 0
      }, 500, function() {
        oldLastColumn.detach();
      });

      if (columnState) this.setColumnState(0, columnState);
    },

    scrollRight: function(columnState) {
      var newLastColumn  = this.invisibleColumns.shift();
      var oldFirstColumn = this.visibleColumns.shift();

      this.visibleColumns.push(newLastColumn);
      this.invisibleColumns.push(oldFirstColumn);
      newLastColumn.appendTo(this.body);
      oldFirstColumn.animate({
        marginLeft: "-1000px"
      }, 500, this.bind(function() {
        oldFirstColumn.css({marginLeft: 0})
        oldFirstColumn.detach();
        this.arrangeColumns();
      }));
      if (columnState) this.setColumnState(this.numVisibleColumns() - 1, columnState);
    },

    setColumnState: function(position, columnState) {
      this.visibleColumns[position].state(columnState);
      this.arrangeColumns();
      this.nextStateIsAlreadySetUp = true;
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    arrangeColumns: function() {
      var relativeWidths = [], totalRelativeWidth = 0;
      _(this.visibleColumns).each(function(column, i) {
        relativeWidths[i] = column.currentView.relativeWidth;
        totalRelativeWidth = totalRelativeWidth + relativeWidths[i];
      });
      _(this.visibleColumns).each(function(column, i) {
        column.body.width((relativeWidths[i] / totalRelativeWidth * 98.0) + "%");
        column.position(i);
      });
    },

    setCurrentOrganizationId: function() {
      _(this.visibleColumns).first().currentView.setCurrentOrganizationId();
    },

    numVisibleColumns: {
      afterChange: function(numVisibleColumns) {
        if (numVisibleColumns < 1) {
          // take some corrective action
          console.debug("invalid hash");
          return;
        }
        var diff = numVisibleColumns - this.visibleColumns.length;
        if (diff > 0) {
          _(diff).times(function() {
            this.visibleColumns.push(this.invisibleColumns.shift());
            _(this.visibleColumns).last().appendTo(this.body);
          }, this);
        } else if (diff < 0) {
          _(Math.abs(diff)).times(function() {
            this.invisibleColumns.unshift(this.visibleColumns.pop())
            _(this.invisibleColumns).first().detach();
          }, this);
        }
      }
    }
  }
});
