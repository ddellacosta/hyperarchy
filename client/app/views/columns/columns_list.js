_.constructor("Views.ColumnsList", View.Template, {
  content: function() { with(this.builder) {
    ol({id: "columns"}).ref("body");
  }},

  viewProperties: {
    viewName: 'columns',

    initialize: function() {
      this.columns = [];
      this.numColumns = this.MAX_VISIBLE_COLUMNS + this.MIN_INVISIBLE_COLUMNS;
      for (var i = 0; i < this.numColumns; i++) {
        this.append(this.columns[i] = Views.ColumnLi.toView());
      }
    },

    navigate: function(state) {
      if (this.nextStateIsAlreadySetUp) {
        this.nextStateIsAlreadySetUp = false;
      } else {
        var columnStates = this.getColumnStatesFromUrlState(state);
        this.numVisibleColumns(columnStates.length);
        _(this.visibleColumns()).each(function(column, i) {
          column.state(columnStates[i]);
        }, this);
        this.arrangeColumns();
      }

      Application.currentOrganizationId(this.columns[0].currentView().organizationId());
      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.hideSubNavigationContent();
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      var selectedRecordId, tableName, parentRecordId, parentTableName = "root";
      for (var i = 0; i < this.MAX_VISIBLE_COLUMNS; i++) {
        tableName        = state["col" + (i+1)];
        selectedRecordId = parseInt(state["id" + (i+1)]);
        if (! _(this.tableNamesByParentName[parentTableName]).include(tableName)) break;
        if (i == 0 && !selectedRecordId) break;
        if (i >  0 && !parentRecordId)   break;

        columnStates[i] = {
          tableName:       tableName,
          parentTableName: parentTableName,
          selectedId:      selectedRecordId,
          parentId:        parentRecordId
        };

        parentRecordId  = selectedRecordId;
        parentTableName = tableName;
      }
      return columnStates;
    },

    getUrlStateFromColumnStates: function() {
      state = {};
      _(this.visibleColumns()).each(function(column, i) {
        state["col" + (i+1)] = column.state().tableName;
        state["id" + (i+1)] = column.state().selectedId;
      });
      return state;
    },

    scrollLeft: function(columnState) {
      var newFirstColumn = this.columns.pop();
      this.columns.unshift(newFirstColumn);
      newFirstColumn.detach();
      newFirstColumn.prependTo(this.body);
      if (columnState) {
        this.setIndividualColumnState(0, columnState);
      }
    },

    scrollRight: function(columnState) {
      var newLastColumn = this.columns.shift();
      this.columns.push(newLastColumn);
      newLastColumn.detach();
      newLastColumn.appendTo(this.body);
      if (columnState) {
        var lastColumnNum = this.numVisibleColumns() - 1;
        this.setIndividualColumnState(lastColumnNum, columnState);
      }
    },

    setIndividualColumnState: function(columnNumber, columnState) {
      this.columns[columnNumber].state(columnState);
      this.arrangeColumns();
      this.nextStateIsAlreadySetUp = true;
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    arrangeColumns: function() {
      var totalRelativeWidth = _(this.visibleColumns()).reduce(0, function(sum, column) {
         return sum + column.relativeWidth();
      });
      _(this.visibleColumns()).each(function(column) {
        column.body.width((column.relativeWidth() / totalRelativeWidth * 99.0) + "%");
        column.show();
      });

      _(this.invisibleColumns()).each(function(column) {
        column.hide();
      });
    },

    numVisibleColumns: {
      afterChange: function(numVisibleColumns) {
        if (numVisibleColumns < 1) {
          // take some corrective action
          console.debug("invalid hash");
        }
      }
    },

    visibleColumns: function() {
      return this.columns.slice(0, this.numVisibleColumns());
    },

    invisibleColumns: function() {
      return this.columns.slice(this.numVisibleColumns());
    },

    // constants

    MAX_VISIBLE_COLUMNS:   3,
    MIN_INVISIBLE_COLUMNS: 2,

    tableNamesByParentName: {
      root: [
        "organizations",
        "elections",
        "candidates"
      ],
      organizations: [
        "elections"
      ],
      elections: [
        "candidates",
        "comments"
      ],
      candidates: [
        "comments"
      ],
      electionComments:  [],
      candidateComments: []
    }
  }
});
