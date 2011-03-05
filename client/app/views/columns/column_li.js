_.constructor("Views.Columns.ColumnLi", View.Template, {
  content: function() {
    this.builder.tag("li", {'class': "column"});
  },

  viewProperties: {

    initialize: function() {
      this.listings = {
        organizations: Views.Columns.OrganizationsListing.toView(),
        votes:         Views.Columns.VotesListing.toView(),
        elections:     Views.Columns.ElectionsListing.toView(),
        candidates:    Views.Columns.CandidatesListing.toView(),
        comments:      Views.Columns.CommentsListing.toView()
      };

      _(this.listings).each(function(listing) {
        listing.hide();
        listing.appendTo(this);
        listing.containingColumn = this;
      }, this);
    },

    state: {
      afterChange: function(columnState, oldState) {
        if (!columnState || _(columnState).isEqual(oldState)) return;
        var listingName = columnState.tableName;
        this.switchToListing(listingName);
        this.currentListing.state(columnState);
      }
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

    handleInvalidState: function(invalidState) {
      this.containingList.handleInvalidState(invalidState);
    },

    switchToListing: function(listingName) {
      if (! this.listings[listingName]) this.handleInvalidState();
      _(this.listings).each(function(listing, name) {
        if (name === listingName) listing.show();
        else listing.hide();
      });
      this.currentListing = this.listings[listingName];
    },

    columnNumber: {
      afterChange: function() {}
    },

    isFirst: function() {
      return (this.columnNumber() === 0);
    }
  }
});
