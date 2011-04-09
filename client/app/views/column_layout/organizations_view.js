_.constructor("Views.ColumnLayout.OrganizationsView", View.Template, {
  content: function() {with(this.builder) {
    div({'class': "organizations columnView"}, function() {
      div({'class': "header"}, function() {
        h2("Organizations");
      }).ref("header");
      div({'class': "left section"}, function() {
        div({'class': "unranked recordsList"}, function() {
          subview('unrankedList', Views.SortedList);
          div({'class': "loading"}).ref("loading");
        });
      }).ref("leftSection");
      div({'class': "right section"}, function() {
        subview('recordDetails', Views.ColumnLayout.OrganizationDetails);
      }).ref("rightSection");
    });
  }},

  viewProperties: {

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.unrankedList.buildElement = this.bind(function(record) {
        return Views.ColumnLayout.OrganizationLi.toView({
          record: record,
          containingView: this
        });
      });
      this.recordDetails.containingView = this;
    },

    state: {
      afterChange: function(state, oldState) {
        var relationIsTheSame = oldState &&
                                (state.parentRecordId === oldState.parentRecordId) &&
                                (state.parentTableName === oldState.parentTableName);
        if (relationIsTheSame) {
          this.selectedRecordId(state.recordId);
          this.recordDetails.selectedChildTableName(state.childTableName);
          return;
        }

        this.startLoading();
        try {
          this.fetchRelations(state).onSuccess(function() {
            this.unrankedList.relation(this.mainRelation(state));
            this.selectedRecordId(state.recordId);
            this.recordDetails.selectedChildTableName(state.childTableName);
            if (this.isInFirstColumn()) this.setCurrentOrganizationId();
            this.stopLoading();
          }, this);
        } catch (badColumnState) {
          this.containingColumn.handleInvalidState(badColumnState);
        }
      }
    },

    fetchRelations: function(state) {
      return Server.fetch([
        this.mainRelation(state)
      ]);
    },

    mainRelation: function(state) {
      return Application.currentUser().admin() ? Organization.orderBy('name') :
               Application.currentUser().confirmedMemberships().
                 joinThrough(Organization).orderBy('name');
    },

    selectedRecordId: {
      afterChange: function(id) {
        if (! id) return;
        this.recordDetails.recordId(id);
        this.unrankedList.children().removeClass("selected");
        var selectedLi = this.unrankedList.elementsById[id];
        if (! selectedLi) return;
        selectedLi.addClass("selected");
      }
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    },

    isInFirstColumn: function() {
      return (this.containingColumn.number == 0);
    },

    startLoading: function() {
      this.unrankedList.hide();
      this.loading.show();
      this.recordDetails.startLoading();
    },

    stopLoading: function() {
      this.loading.hide();
      this.unrankedList.show();
      this.recordDetails.stopLoading();
      this.adjustHeight();
    },

    adjustHeight: function() {
      this.leftSection.fillContainingVerticalSpace();
      this.rightSection.fillContainingVerticalSpace();
    }
  }
});
