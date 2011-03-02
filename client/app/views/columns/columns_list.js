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
      var totalColumns = this.MAX_VISIBLE_COLUMNS + this.MIN_INVISIBLE_COLUMNS;
      for (var i = 0; i < totalColumns; i++) {
        this.invisibleColumns[i] = Views.Columns.ColumnLi.toView();
        this.invisibleColumns[i].containingList = this;
      }
    },

    navigate: function(state) {
      if (this.nextStateIsAlreadySetUp) {
        this.nextStateIsAlreadySetUp = false;
        return;
      }
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      this.numVisibleColumns(newColumnStates.length);
      _(this.visibleColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      this.formatColumns();

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
        if (! (tableName && (recordId || (parentTableName && parentRecordId)))) break;
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
        var state = column.state();
        if (state.tableName)       urlState["col" + (i+1)] = state.tableName;
        if (state.parentTableName) urlState["col" + i]     = state.parentTableName;
        if (state.recordId)        urlState["id" + (i+1)]  = state.recordId;
        if (state.parentRecordId)  urlState["id" + i]      = state.parentRecordId;
      });
      return urlState;
    },

    scrollLeft: function() {
      var newFirstColumn = this.invisibleColumns.pop();
      var oldLastColumn  = this.visibleColumns.pop();
      this.visibleColumns.unshift(newFirstColumn);
      this.invisibleColumns.unshift(oldLastColumn);
      this.renumberColumns();
      this.formatColumns();

      newFirstColumn.css({
        marginLeft: (-1.2 * newFirstColumn.width())
      });
      newFirstColumn.prependTo(this.body);
      this.defer(function() {
        newFirstColumn.animate({
          marginLeft: 0
        }, 'slow', function() {
          oldLastColumn.detach();
        });
      });
    },

    scrollRight: function() {
      var newLastColumn  = this.invisibleColumns.shift();
      var oldFirstColumn = this.visibleColumns.shift();
      this.visibleColumns.push(newLastColumn);
      this.invisibleColumns.push(oldFirstColumn);
      this.renumberColumns();
      this.formatColumns();

      newLastColumn.appendTo(this.body);
      this.defer(function() {
        oldFirstColumn.animate({
          marginLeft: (-1.2 * oldFirstColumn.width())
        }, 'slow', this.bind(function() {
          oldFirstColumn.css({marginLeft: 0});
          oldFirstColumn.detach();
        }));
      });
    },

    setColumnState: function(column, columnState) {
      column.state(columnState);
      this.nextStateIsAlreadySetUp = true;
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollLeftAndSetLeftColumnState: function(columnState) {
      var newFirstColumn = _(this.invisibleColumns).last();
      newFirstColumn.state(columnState);
      this.defer(function() {
        this.scrollLeft();
        this.nextStateIsAlreadySetUp = true;
        $.bbq.pushState(this.getUrlStateFromColumnStates());
      });
    },

    scrollRightAndSetRightColumnState: function(columnState) {
      var newLastColumn = _(this.invisibleColumns).first();
      newLastColumn.state(columnState);
      this.defer(function() {
        this.scrollRight();
        this.nextStateIsAlreadySetUp = true;
        $.bbq.pushState(this.getUrlStateFromColumnStates());
      });
    },

    formatColumns: function() {
      var relativeWidths = [], totalRelativeWidth = 0;
      _(this.visibleColumns).each(function(column, i) {
        relativeWidths[i] = column.currentView.relativeWidth;
        totalRelativeWidth = totalRelativeWidth + relativeWidths[i];
      });
      _(this.visibleColumns).each(function(column, i) {
        column.body.width((relativeWidths[i] / totalRelativeWidth * 98.0) + "%");
        column.removeClass("first");
      });
      this.visibleColumns[0].addClass("first");
    },

    numVisibleColumns: {
      afterChange: function(numVisibleColumns) {
        if (numVisibleColumns < 1) {
          console.debug("invalid url hash"); // redirect somewhere
          return;
        }
        var numColumnsToAdd = numVisibleColumns - this.visibleColumns.length;
        if (numColumnsToAdd > 0) {
          _(numColumnsToAdd).times(function() {
            this.visibleColumns.push(this.invisibleColumns.shift());
            _(this.visibleColumns).last().appendTo(this.body);
          }, this);
        } else {
          _(-1 * numColumnsToAdd).times(function() {
            _(this.visibleColumns).last().detach();
            this.invisibleColumns.unshift(this.visibleColumns.pop())
          }, this);
        }
        this.renumberColumns();
      }
    },

    renumberColumns: function() {
      _(this.visibleColumns).each(function(column, i) {
        column.columnNumber(i);
      });
    }
  }
});
