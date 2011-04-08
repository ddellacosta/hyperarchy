_.constructor("Views.ColumnLayout.CandidatesView", View.Template, {

  content: function() {with(this.builder) {
    div({'class': "candidates columnView"}, function() {
      div({'class': "header"}, function() {
        h2("Answers");
      }).ref("header");
      div({'class': "left section"}, function() {
        div({'class': "unranked recordsList"}, function() {
          subview('unrankedList', Views.SortedList);
          div({'class': "loading"}).ref("loading");
        });
      }).ref("leftSection");
      div({'class': "right section"}, function() {
        subview('recordDetails', Views.ColumnLayout.CandidateDetails);
        subview('rankedList', Views.ColumnLayout.RankedCandidatesList);
      }).ref("rightSection");
    });
  }},

  viewProperties: {

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.unrankedList.buildElement = this.bind(function(record) {
        return Views.ColumnLayout.UnrankedCandidateLi.toView({
          record: record,
          containingView: this
        });
      });
      this.recordDetails.containingView = this;
      this.recordDetails.hide();
      this.rankedList.containingView = this;
      this.rankedList.setupSortable();
    },

    state: {
      afterChange: function(state, oldState) {
        var mainRelationHasChanged = (! oldState)
                                     || (state.parentRecordId  !== oldState.parentRecordId)
                                     || (state.parentTableName !== oldState.parentTableName);
        if (mainRelationHasChanged) {
          this.startLoading();
          try {
            this.fetchRelations(state).onSuccess(function() {
              var candidatesRelation = this.mainRelation(state);
              var rankingsRelation = candidatesRelation.joinThrough(Ranking).
                                     where({userId: state.userId}).
                                     orderBy(Ranking.position.desc());
              this.unrankedList.relation(candidatesRelation);
              this.rankedList.rankingsRelation(rankingsRelation);
              this.selectedRecordId(state.recordId);
              this.recordDetails.selectedChildLink(state.childTableName);
              if (this.isInFirstColumn()) this.setCurrentOrganizationId();
              this.stopLoading();
            }, this);
          } catch (invalidState) {this.containingColumn.handleInvalidState(invalidState)}
          return;
        }

        var rankingRelationHasChanged = (! oldState) || (state.userId !== oldState.userId);
        if (rankingRelationHasChanged) {
          var candidatesRelation = this.mainRelation(state);
          var rankingsRelation = candidatesRelation.joinThrough(Ranking).
                                 where({userId: state.userId}).
                                 orderBy(Ranking.position.desc());
          this.rankedList.startLoading();
          rankingsRelation.fetch().onSuccess(function() {
            this.rankedList.stopLoading();
            this.rankedList.rankingsRelation(rankingsRelation);
          }, this);
        }

        this.selectedRecordId(state.recordId);
        this.recordDetails.selectedChildLink(state.childTableName);
      }
    },

    fetchRelations: function(state) {
      var candidatesRelation = this.mainRelation(state);
      return Server.fetch([
        candidatesRelation.join(User).on(Candidate.creatorId.eq(User.id)),
        candidatesRelation.joinThrough(Election),
        candidatesRelation.joinThrough(Ranking).where({userId: state.userId})
      ]);
    },

    mainRelation: function(state) {
      if (state.parentRecordId) {
        return Candidate.where({electionId: state.parentRecordId})
      } else {
        return Candidate.where({id: state.recordId});
      }
    },

    selectedRecordId: {
      afterChange: function(id) {
        if (! id) {
          this.showRankedList();
          this.unrankedList.children().removeClass("selected");
          return;
        }

        this.rankedList.hide();
        this.recordDetails.show();
        this.recordDetails.recordId(id);
        this.unrankedList.children().removeClass("selected");
        var selectedLi = this.unrankedList.elementsById[id];
        if (! selectedLi) return;
        selectedLi.addClass("selected");
      }
    },

    showRankedList: function() {
      this.header.show();
      this.recordDetails.hide();
      this.rankedList.show();
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
      this.rankedList.adjustHeight();
    }
  }
});
