_.constructor("Views.Columns.ColumnView", View.Template, {
  content: function() { with(this.builder) {
    div(template.rootAttributes, function() {
      div({'class': "columnHeader"}, function() {
        template.headerContent();
      }).ref("header");

      div({'class': "columnBody"}, function() {
        subview('mainList', Views.SortedList, {
          rootAttributes: template.listAttributes
          // buildElement function set upon initialize
        });
        template.additionalBodyContent();
      }).ref("body");

      div({'class': "bigLoading"}).ref("loading");
    });
  }},

  // override these:
  headerContent:         function(state) {},
  additionalBodyContent: function(state) {},
  liConstructor:  Views.Columns.RecordLi,
  listAttributes: {'class': "columnList"},
  rootAttributes: {},


  viewProperties: {

    // override these:
    relativeWidth: 1,
    mainRelationForState:        function(state) {},
    additionalRelationsForState: function(state) {},
    setCurrentOrganizationId:    function() {
      Application.currentOrganizationId(1);
    },
    mainRelation: {
      afterChange: function(relation) {}
    },

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
          var mainRelation = this.mainRelationForState(state);
          var additionalRelations = this.additionalRelationsForState(state);
          Server.fetch([mainRelation].concat(additionalRelations)).onSuccess(function() {
            this.mainRelation(mainRelation);
            if (this.isFirstColumn()) this.setCurrentOrganizationId();
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
        if (this.isFirstColumn()) {
          this.mainList.children().hide();
          selectedLi.show();
        }
      }
    },

    startLoading: function() {
      this.body.hide();
      this.loading.show();
    },

    stopLoading: function() {
      this.loading.hide();
      this.body.show();
    },

    isFirstColumn: function() {
      return this.containingColumn.isFirst();
    },

    adjustHeight: function(minHeight) {
      this.mainList.fillVerticalSpace(20, minHeight - 30);
    }
  }
});
