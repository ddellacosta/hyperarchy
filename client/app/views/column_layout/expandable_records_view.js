_.constructor("Views.ColumnLayout.ExpandableRecordsView", View.Template, {

  content: function() {with(this.builder) {
    div({'class': template.tableName + " columnView"}, function() {
      div({'class': "header"}, function() {
        template.leftHeader();
        template.rightHeader();
      }).ref("header");
      div({'class': "section"}, function() {
        div({'class': "unranked recordsList"}, function() {
          subview('unrankedList', Views.SortedList);
          div({'class': "loading"}).ref("loading");
        });
        template.additionalLeftContent();
      }).ref("leftSection");
      div({'class': "right section"}, function() {
        subview('recordDetails', template.detailsTemplate);
        template.additionalRightContent();
      }).ref("rightSection");
    });
  }},

  // template properties to override:
  tableName: "records",
  liTemplate: Views.ColumnLayout.RecordLi,
  detailsTemplate: Views.ColumnLayout.RecordDetails,
  leftHeader: function() {},
  rightHeader: function() {},
  additionalLeftContent: function() {},
  additionalRightContent: function() {},

  viewProperties: {

    // view methods to implement:
    mainRelationToFetch: function(state) {},
    otherRelationsToFetch: function(state) {},
    mainRelation: {afterChange: function() {}},
    setCurrentOrganizationId: function() {},

    // shared view methods:
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.unrankedList.buildElement = this.bind(function(record) {
        return this.template.liTemplate.toView({
          record: record,
          containingView: this
        });
      });
      this.recordDetails.containingView = this;
    },

    state: {
      afterChange: function(state, oldState) {
        if (! oldState) oldState = {};
        if (! state.parentRecordId)  state.parentRecordId = oldState.parentRecordId;
        if (! state.parentTableName) state.parentTableName = oldState.parentTableName;
        if (! state.childTableName)  state.childTableName = oldState.childTableName;

        var relationIsTheSame = (oldState.parentRecordId && oldState.parentTableName) &&
                                (oldState.parentRecordId === state.parentRecordId) &&
                                (oldState.parentTableName === state.parentTableName);
        if (relationIsTheSame) {
          this.selectedRecordId(state.recordId);
          this.childTableName(state.childTableName);
          return;
        }

        this.startLoading();
        try {
          var mainRelation   = this.mainRelationToFetch(state);
          var otherRelations = this.otherRelationsToFetch(mainRelation);
          var relationsToFetch = [mainRelation].concat(otherRelations);
          Server.fetch(relationsToFetch).onSuccess(function() {
            this.mainRelation(mainRelation);
            this.selectedRecordId(state.recordId);
            this.childTableName(state.childTableName);
            if (this.isInFirstColumn()) this.setCurrentOrganizationId();
            this.stopLoading();
          }, this);
        } catch (badColumnState) {
          this.containingColumn.handleInvalidState(badColumnState);
        }
      }
    },

    selectedRecordId: {
      afterChange: function(id) {
        if (! id) return;
        var selectedLi = this.unrankedList.elementsById[id];
        if (! selectedLi) return;
        this.unrankedList.children().removeClass("selected");
        selectedLi.addClass("selected");
        this.recordDetails.recordId(id);
        this.showRecordDetails();
      }
    },

    childTableName: {
      afterChange: function(childTableName) {
        this.recordDetails.selectedChildLink(childTableName);
      }
    },

    showRecordDetails: function() {
      this.rightSection.children().hide();
      this.recordDetails.show();
      this.adjustHeight();
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
    },

    afterShow: function() {
      this.adjustHeight();
    }
  }
});
