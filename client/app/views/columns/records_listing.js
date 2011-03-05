_.constructor("Views.Columns.RecordsColumn", View.Template, {
  content: function() { with(this.builder) {
    var rootAttributes = template.rootAttributes || {};
    div(rootAttributes, function() {
      div({'class': "columnHeader"}, function() {
        template.headerContent();
      }).ref("header");

      div({'class': "columnBody"}, function() {
        subview('mainList', Views.SortedList, {
          rootAttributes: {'class': "columnList"}
          // buildElement function set upon initialize
        });
        template.rightSubColumn();
        div({'class': "clear"});
      }).ref("body");

      div({'class': "bigLoading"}).ref("loading");
    });
  }},

  rootAttributes: {},                 // override
  liConstructor:  null,               // override
  headerContent: function(state) {},  // override
  rightSubColumn: function(state) {}, // override

  viewProperties: {

    relativeWidth: 1,                                // override
    mainRelationForState: function(state) {},        // override
    additionalRelationsForState: function(state) {}, // override
    populateBody: function(relation) {},             // override

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.mainList.buildElement = this.bind(function(record) {
        return this.template.liConstructor.toView({
          record: record,
          containingListing: this
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
            this.populateBody(mainRelation);
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

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    },

    isFirstColumn: function() {
      return this.containingColumn.isFirst();
    }
  }
});
