_.constructor("Views.Columns.RecordsColumn", View.Template, {
  content: function() { with(this.builder) {
    var rootAttributes = template.rootAttributes || {};

    div(rootAttributes, function() {
      div({'class': "columnHeader"}, function() {
        template.headerContent();
      });

      div({'class': "columnBody"}, function() {

        subview('mainList', Views.SortedList, {
          rootAttributes: {'class': "recordsList"}
          // buildElement function set upon initialize
        });

        div({'class': "clear"});
        div({'class': "loading"}).ref("loading");
      }).ref("body");
    });
  }},

  viewProperties: {

    relativeWidth: 2,

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.mainList.buildElement = this.bind(function(record) {
        return template.liConstructor.toView({
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
        } else {
          this.startLoading();
          try {
            var mainRelation = this.mainRelationForState(state);
            var additionalRelations = this.additionalRelationsForState(state);
            Server.fetch([mainRelation].concat(additionalRelations)).onSuccess(function() {
              this.populateLists()
              if (this.isFirstColumn()) this.setCurrentOrganizationId();
              this.selectedRecordId(state.recordId);
              this.stopLoading();
            });
          } catch (invalidColumnState) {
            this.containingColumn.handleInvalidColumnState();
          }
        }
      }
    },

    populateLists: function() {
      // implement in subclasses
    },

    selectedRecordId: {
      afterWrite: function(id) {
        var selectectedRecord = Candidate.find(id);
        var selectedLi = this.candidatesList.elementForRecord(selectectedRecord);
        if (this.isFirstColumn()) {
          this.candidatesList.children().hide();
          selectedLi.show();
        }
        this.candidatesList.children().removeClass("selected");
        selectedLi.addClass("selected");
      }
    },

    startLoading: function() {
      this.candidatesList.hide();
      this.rankedCandidatesList.hide();
      this.loading.show();
    },

    stopLoading: function() {
      this.loading.hide();
      this.candidatesList.show();
      this.rankedCandidatesList.show();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    },

    isFirstColumn: function() {
      return this.containingColumn.isFirst();
    }
  }
});
