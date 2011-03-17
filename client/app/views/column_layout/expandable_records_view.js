_.constructor("Views.ColumnLayout.ExpandableRecordsView", View.Template, {
  content: function() {with(this.builder) {
    div({'class': template.tableName}, function() {
      div({'class': "columnHeader"}, function() {
        template.headerContent();
      }).ref("header");
      div({'class': "columnBody"}, function() {
        div({'class': "listContainer"}, function() {
          subview('mainList', Views.SortedList, {
            rootAttributes: {'class': template.tableName+"List"}
          });
          div({'class': "listLoading"}).ref("mainLoading");
        }).ref("mainListContainer");
        subview('detailsArea', template.detailsTemplate);
        template.additionalBodyContent();
      }).ref("body");
    });
  }},

  // template properties to override:
  tableName: "records",
  liTemplate:      Views.ColumnLayout.RecordLi,
  detailsTemplate: Views.ColumnLayout.RecordDetails,
  headerContent:         function() {},
  additionalBodyContent: function() {},

  viewProperties: {

    // view methods to implement:
    mainRelationToFetch: function(state) {},
    otherRelationsToFetch: function(state) {},
    mainRelation: {afterChange: function() {}},
    setCurrentOrganizationId: function() {},

    // shared view methods:
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.mainList.buildElement = this.bind(function(record) {
        return this.template.liTemplate.toView({
          record: record,
          containingView: this
        });
      });
      this.detailsArea.containingView = this;
      this.defer(this.hitch('adjustHeight'));
    },

    state: {
      afterChange: function(state, oldState) {
        var relationIsTheSame = (oldState &&
          (state.parentRecordId  === oldState.parentRecordId) &&
          (state.parentTableName === oldState.parentTableName));
        if (relationIsTheSame) {
          this.selectedRecordId(state.recordId);
          return;
        }
        var multipleRecordsSpecified = (state.parentTableName && state.parentRecordId);
        if (multipleRecordsSpecified) {
          this.showMainListAndDetailsArea();
        } else {
          this.showDetailsAreaOnly();
        }

        this.startLoading();
        try {
          var mainRelation   = this.mainRelationToFetch(state);
          var otherRelations = this.otherRelationsToFetch(mainRelation);
          var relationsToFetch = [mainRelation].concat(otherRelations);
          Server.fetch(relationsToFetch).onSuccess(function() {
            this.mainRelation(mainRelation);
            this.selectedRecordId(state.recordId);
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
        var selectedLi = this.mainList.elementsById[id];
        if (! selectedLi) return;
        this.mainList.children().removeClass("selected");
        selectedLi.addClass("selected");
        this.detailsArea.recordId(id);
      }
    },

    showMainListAndDetailsArea: function() {
      this.header.show();
      this.mainListContainer.removeClass('columnRight columnFull');
      this.mainListContainer.addClass('columnLeft');
      this.detailsArea.removeClass('columnLeft columnFull');
      this.detailsArea.addClass('columnRight');
      this.body.children().hide();
      this.mainListContainer.show();
      this.detailsArea.show();
      this.adjustHeight();
    },

    showDetailsAreaOnly: function() {
      this.header.hide();
      this.detailsArea.removeClass('columnLeft columnRight');
      this.detailsArea.addClass('columnFull');
      this.mainList.hide();
      this.body.children().hide();
      this.detailsArea.siblings().hide();
      this.detailsArea.show();
      this.adjustHeight();
    },

    isInFirstColumn: function() {
      return (this.containingColumn.number() == 0);
    },

    startLoading: function() {
      this.mainList.hide();
      this.mainLoading.show();
      this.detailsArea.startLoading();
      this.adjustHeight();
    },

    stopLoading: function() {
      this.mainLoading.hide();
      this.mainList.show();
      this.detailsArea.stopLoading();
      this.adjustHeight();
    },

    adjustHeight: function() {
      this.body.fillContainingVerticalSpace(20);
    },

    afterShow: function() {
      this.adjustHeight();
    },

    relativeWidth: 1
  }
});
