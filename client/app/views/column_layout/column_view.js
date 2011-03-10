_.constructor("Views.ColumnLayout.ColumnView", View.Template, {

  // template properties to override:
  liConstructor: Views.ColumnLayout.RecordLi,
  headerContent: function() {},
  detailsArea:   null,
  rankedList:    null,

  content: function() {with(this.builder) {
    div({'class': "columnView"}, function() {
      div({'class': "columnHeader"}, function() {
        template.headerContent();
      }).ref("header");
      div({'class': "columnBody"}, function() {
        div({'class': "columnLeftContent"}, function() {
          subview('mainList', Views.SortedList, {
            rootAttributes: {'class': "columnList"}
          });
          div({'class': "loading"}).ref("leftLoading");
        });
        div({'class': "columnRightContent"}, function() {
          if (template.rankedList)  template.rankedList();
          if (template.detailsArea) template.detailsArea();
          div({'class': "loading"}).ref("rightLoading");
        }).ref("rightContent");
      }).ref("body");
    });
  }},

  viewProperties: {

    // view properties to override:
    getMainRelationFromColumnState:   function(state) {},
    getOtherRelationsFromColumnState: function(state) {},
    mainRelation: {afterChange: function(relation) {}},
    setCurrentOrganizationId: function() {},



    // shared view properties:
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.mainList.buildElement = this.bind(function(record) {
        return this.template.liConstructor.toView({
          record: record,
          containingView: this
        });
      });
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

        this.startLoading();
        try {
          var mainRelation   = this.getMainRelationFromColumnState(state);
          var otherRelations = this.getOtherRelationsFromColumnState(state);
          Server.fetch([mainRelation].concat(otherRelations)).onSuccess(function() {
            this.mainRelation(mainRelation);
            if (this.isInFirstColumn()) this.setCurrentOrganizationId();
            this.selectedRecordId(state.recordId);
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
      }
    },

    containingColumnNumber: {
      afterChange: function() {
        if (this.isInFirstColumn()) {
          this.header.hide();
          this.leftContent.hide();
          this.rightContent.children().hide();
          this.rightContent.show();
          this.detailsArea.
          this.detailsArea.show();
        }
      }
    },

    isInFirstColumn: function() {
      return (this.containingColumnNumber() == 0);
    },

    startLoading: function() {
      this.mainList.hide();
      this.leftLoading.show();
      if (this.detailsArea) this.detailsArea.hide();
      if (this.rankedList) this.rankedList.hide();
      this.rightLoading.show();
    },

    stopLoading: function() {
      this.leftLoading.hide();
      this.mainList.show();
      this.rightLoading.hide();
      if (this.rankedList) this.rankedList.hide();
      if (this.detailsArea) this.detailsArea.show();
    },

    showDetailsArea: function() {
      this.rightContent.children().hide();
      this.detailsArea.show();
    },

    adjustHeight: function(minHeight) {
      this.mainList.fillVerticalSpace(20, minHeight - 40);
      this.rightContent.fillVerticalSpace(20, minHeight - 40);
      if (this.rankedList) this.rankedList.adjustHeight(minHeight - 40);
    },

    relativeWidth: 1
  }
});
