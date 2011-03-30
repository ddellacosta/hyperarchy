_.constructor("Views.ColumnLayout.ColumnsList", View.Template, {
  content: function() {with(this.builder) {
    div({'id': "columns"}, function() {
      div({'class': "subnav"});
      ol().ref("list");
    });
  }},

  viewProperties: {
    viewName:    'columns',
    defaultView:  true,
    numColumns: 4,
    maxOnScreenColumns:  2,

    initialize: function() {
      this.onScreenColumns       = [];
      this.offScreenLeftColumns  = [];
      this.offScreenRightColumns = [];
      for (var i = 0; i < this.numColumns - 1; i++) {
        this.offScreenLeftColumns[i] = Views.ColumnLayout.ColumnLi.toView();
      }
      this.offScreenRightColumns[0] = Views.ColumnLayout.ColumnLi.toView();
      _(this.offScreenColumns()).each(function(column) {
        column.containingList = this;
        column.appendTo(this.list);
      }, this);

      $(window).resize(this.hitch('adjustHeight'));
      this.defer(this.hitch('adjustHeight'))
    },

    navigate: function(state) {
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      this.numOnScreenColumns(newColumnStates.length);
      this.shiftColumnsToMatch(newColumnStates);
      _(this.onScreenColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      if (this.renumberColumns()) this.arrangeColumns('fast');

      Application.layout.activateNavigationTab("questionsLink");
    },

    // --- private ---

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      var tableName, parentTableName, childTableName, recordId, parentRecordId;
      for (var i = 0; i < this.maxOnScreenColumns; i++) {
        parentTableName = state["col" + i];
        tableName       = state["col" + (i+1)];
        childTableName  = state["col" + (i+2)];
        parentRecordId  = parseInt(state["id" + i]);
        recordId        = parseInt(state["id" + (i+1)]);
        if (!tableName) break;
        if (!recordId && !(parentTableName && parentRecordId)) break;
        columnStates[i] = {
          tableName:       tableName,
          parentTableName: parentTableName,
          childTableName:  childTableName,
          recordId:        recordId,
          parentRecordId:  parentRecordId
        };
      }
      return columnStates;
    },

    numOnScreenColumns: {
      afterChange: function(newNumber, oldNumber) {
        if (newNumber < 1) this.handleInvalidState();
        var numberToAdd = newNumber - (oldNumber || 0);
        _(numberToAdd).times(function() {
          this.onScreenColumns.unshift(this.offScreenLeftColumns.pop())
        }, this);
        _(numberToAdd * -1).times(function() {
          this.offScreenLeftColumns.push(this.onScreenColumns.shift());
        }, this);
      }
    },

    shiftColumnsToMatch: function(newStates) {
      var state, doesMatch, offset;
      _(this.onScreenColumns).any(function(column, i) {
        state = column.state();
        if (!state) return false;
        return _(newStates).any(function(newState, j) {
          doesMatch = newState.tableName === state.tableName && newState.recordId  === state.recordId;
          if (doesMatch) {
            offset = i - j;
            return true;
          }
        });
      });

      if (offset) this.shiftColumns(offset);
    },

    shiftColumns: function(offset) {
      if (offset > 0) {
        _(offset).times(function() {
          this.offScreenLeftColumns.push(this.onScreenColumns.shift());
          this.onScreenColumns.push(this.offScreenRightColumns.shift());
          this.offScreenRightColumns.push(this.offScreenLeftColumns.shift());
        }, this);
      }
      if (offset < 0) {
        _(offset * -1).times(function() {
          this.offScreenRightColumns.unshift(this.onScreenColumns.pop());
          this.onScreenColumns.unshift(this.offScreenLeftColumns.pop());
          this.offScreenLeftColumns.unshift(this.offScreenRightColumns.pop());
          
          this.onScreenColumns[0].addClass("first");
          this.onScreenColumns[1].removeClass("first");
        }, this);
      }
    },

    arrangeColumns: function(duration) {
      if (! duration) duration = 0;
      var width = 100.0 / (this.numOnScreenColumns() - 1/2);

      _(this.offScreenRightColumns).each(function(column, i) {
        column.animate({
          width: width + "%",
          left: 100 + (i * width) + "%"
        }, duration, function() {
          column.hide();
          column.removeClass("first");
        });
      }, this);

      var n = this.offScreenLeftColumns.length;
      _(this.offScreenLeftColumns).each(function(column, i) {
        column.animate({
          width: width + "%",
          left: ((-1/2 - n + i) * width) + "%"
        }, duration, function() {
          column.hide();
          column.removeClass("first");
        });
      }, this);

      _(this.onScreenColumns).each(function(column, i) {
        column.show();
        column.animate({
          width: width + '%',
          left: ((i - 1/2) * width)  + '%'
        }, duration, function() {
          column[(i > 0) ? 'removeClass' : 'addClass']("first");
          column.adjustHeight();
        });
      }, this);
    },

    renumberColumns: function() {
      var change = false;
      _(this.onScreenColumns).each(function(column, i) {
        if (i !== column.number) change = true;
        column.number = i;
      });
      _(this.offScreenColumns()).each(function(column) {
        column.number = null
      });
      return change;
    },

    offScreenColumns: function() {
      return this.offScreenLeftColumns.concat(this.offScreenRightColumns);
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
      // redirect to some default state
    },

    adjustHeight: function() {
      this.defer(this.bind(function() {
        this.list.fillContainingVerticalSpace();
        _(this.onScreenColumns).each(function(column) {column.adjustHeight()});
      }));
    }
  }
});
