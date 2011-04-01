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
    maxOnScreenColumns: 2,

    initialize: function() {
      this.onScreenColumns = [];
      this.offScreenLeftColumns = [];
      this.offScreenRightColumns = [];
      for (var i = 0; i < this.numColumns; i++) {
        this.offScreenLeftColumns[i] = Views.ColumnLayout.ColumnLi.toView();
        this.offScreenLeftColumns[i].containingList = this;
        this.offScreenLeftColumns[i].appendTo(this.list);
      }
      this.offScreenRightColumns.push(this.offScreenLeftColumns.pop());
      $(window).resize(this.hitch('adjustHeight'));
      this.defer(this.hitch('adjustHeight'));
    },

    navigate: function(state) {
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      var numberAdded   = this.setNumOnScreenColumns(newColumnStates.length);
      var numberShifted = this.shiftColumnsToMatch(newColumnStates);
      this.renumberColumns();
      _(this.onScreenColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      if (numberAdded || numberShifted) this.defer(
        this.hitch('arrangeColumns', numberAdded, numberShifted));

      Application.layout.activateNavigationTab("questionsLink");
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      for (var i = 0; i < this.maxOnScreenColumns; i++) {
        columnStates[i] = {
          tableName:       state["col" + (i+1)]      || undefined,
          parentTableName: state["col" + i]          || undefined,
          parentRecordId:  parseInt(state["id" + i]) || undefined,
          recordId:        parseInt(state["id" + (i+1)]),
          childTableName:  state["col" + (i+2)]
        };
        if (!columnStates[i].tableName || !(columnStates[i].parentRecordId || columnStates[i].recordId)) {
          columnStates.pop();
          break;
        }
      }
      return columnStates;
    },

    setNumOnScreenColumns: function(newNumber) {
      if (newNumber < 1) this.handleInvalidState();
      var numberAdded = newNumber - this.onScreenColumns.length;
      _(numberAdded).times(function() {
        this.onScreenColumns.unshift(this.offScreenLeftColumns.pop())
      }, this);
      _(numberAdded * -1).times(function() {
        this.offScreenLeftColumns.push(this.onScreenColumns.shift());
      }, this);
      return numberAdded;
    },

    shiftColumnsToMatch: function(newStates) {
      var state, doesMatch, numberShifted;
      _(this.onScreenColumns).any(function(column, i) {
        return _(newStates).any(function(newState, j) {
          state = column.state();
          if (state && (state.tableName === newState.tableName) && (state.recordId === newState.recordId)) {
            numberShifted = i - j;
            return true;
          }
        });
      });
      this.shiftColumns(numberShifted);
      return numberShifted;
    },

    shiftColumns: function(numberShifted) {
      if (numberShifted > 0) _(numberShifted).times(function() {
        this.offScreenLeftColumns.push(this.onScreenColumns.shift());
        this.onScreenColumns.push(this.offScreenRightColumns.shift());
        this.offScreenRightColumns.push(this.offScreenLeftColumns.shift());
      }, this);
      if (numberShifted < 0) _(numberShifted * -1).times(function() {
        this.offScreenRightColumns.unshift(this.onScreenColumns.pop());
        this.onScreenColumns.unshift(this.offScreenLeftColumns.pop());
        this.offScreenLeftColumns.unshift(this.offScreenRightColumns.pop());
      }, this);
    },

    arrangeColumns: function(numberAdded, numberShifted) {
      var duration = 'fast';
      var width = 100.0 / (this.onScreenColumns.length - 1./2);
      var afterAnimate = this.bind(function() {
        this.list.children('column').removeClass('first');
        this.onScreenColumns[0].addClass("first");
        _(this.offScreenColumns()).each(function(column) {column.hide()});
        this.adjustHeight();
      });
      if (numberShifted < 0) {
        this.onScreenColumns[0].show();
        this.onScreenColumns[0].addClass("first");
        this.onScreenColumns[1].removeClass("first");
        this.onScreenColumns[0].adjustHeight();
      }
      if (numberAdded) {
        this.list.children('.column').css('width', width + "%");
        duration = 0;
      }

      var numLeft = this.offScreenLeftColumns.length;
      var lastNum  = this.onScreenColumns.length - 1;
      _(this.offScreenLeftColumns).each(function(column, i) {
        column.animate({left: ((-1./2 - numLeft + i) * width) + "%"}, duration);
      }, this);
      _(this.offScreenRightColumns).each(function(column, i) {
        column.animate({left: 100 + (i * width) + "%"}, duration);
      }, this);
      _(this.onScreenColumns).each(function(column, i) {
        column.show();
        column.animate({left: ((i - 1/2) * width)  + '%'}, duration,
                       (i === lastNum ? afterAnimate : null));
      }, this);
    },

    renumberColumns: function() {
      _(this.onScreenColumns).each(function(column, i) {column.number = i});
      _(this.offScreenColumns()).each(function(column) {column.number = null});
    },

    offScreenColumns: function() {
      return this.offScreenLeftColumns.concat(this.offScreenRightColumns);
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
    },

    adjustHeight: function() {
      this.list.fillContainingVerticalSpace();
      _(this.onScreenColumns).each(function(column) {column.adjustHeight()});
    }
  }
});
