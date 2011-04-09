_.constructor("Views.ColumnLayout.CandidatesView", View.Template, {
  content: function() {with(this.builder) {
    div({'class': "candidates columnView"}, function() {
      div({'class': "left header"}, function() {
        span("Answers");
      }).ref("leftHeader");
      div({'class': "right header"}, function() {
        a("New Answer").
          ref("createRecordLink").
          click("showCreateCandidateForm");
        a("Your Ranking").
          ref("rankingLink").
          click("showRanking");
      }).ref("rightHeader");
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
        var mainRelationHasChanged = (! oldState) ||
                                     (state.parentRecordId  !== oldState.parentRecordId) ||
                                     (state.parentTableName !== oldState.parentTableName);
        if (mainRelationHasChanged) {
          this.fetchRelations(state);
        }
        else {
          var rankingRelationHasChanged = (state.userId !== oldState.userId);
          if (rankingRelationHasChanged) this.fetchRankingRelation(state);
          this.selectedRecordId(state.recordId);
          this.selectedChildTableName(state.childTableName);
        }
      }
    },

    adjustHeight: function() {
      this.leftSection.fillContainingVerticalSpace();
      this.rightSection.fillContainingVerticalSpace();
      this.rankedList.adjustHeight();
    },

    showCreateCandidateForm: function() {
      this.containingColumn.pushState({recordId: "new"});
    },

    showRanking: function() {
      this.containingColumn.pushState({recordId: ""});
    },

    // private

    fetchRelations: function(state) {
      this.startLoading();
      try {
        var mainRelation = this.parseMainRelation(state);
        var rankingsRelation = mainRelation.joinThrough(Ranking).
                               where({userId: state.userId}).
                               orderBy(Ranking.position.desc());
        Server.fetch([
          mainRelation.join(User).on(Candidate.creatorId.eq(User.id)),
          mainRelation.joinThrough(Election),
          rankingsRelation
        ]).onSuccess(function() {
          this.unrankedList.relation(mainRelation);
          this.rankedList.rankingsRelation(rankingsRelation);
          this.selectedRecordId(state.recordId);
          this.selectedChildTableName(state.childTableName);
          if (this.isInFirstColumn()) this.setCurrentOrganizationId();
          this.stopLoading();
        }, this);
      } catch (invalidState) {this.containingColumn.handleInvalidState(invalidState)}
    },

    fetchRankingRelation: function(state) {
      var mainRelation = this.parseMainRelation(state);
      var rankingsRelation = mainRelation.joinThrough(Ranking).
                             where({userId: state.userId}).
                             orderBy(Ranking.position.desc());
      this.rankedList.startLoading();
      rankingsRelation.fetch().onSuccess(function() {
        this.rankedList.stopLoading();
        this.rankedList.rankingsRelation(rankingsRelation);
      }, this);
    },

    parseMainRelation: function(state) {
      if (state.parentRecordId) {
        return Candidate.where({electionId: state.parentRecordId})
      } else {
        return Candidate.where({id: state.recordId});
      }
    },

    relation: function() {
      return this.unrankedList.relation();
    },

    selectedRecordId: {
      afterChange: function(id) {
        this.unrankedList.children().removeClass("selected");
        if (! id) {
          this.rightHeader.children().removeClass('active');
          this.rankingLink.addClass('active');
          this.showRankedList();
        } else if (id === "new") {
          this.rightHeader.children().removeClass('active');
          this.createRecordLink.addClass('active');
          this.showRecordDetails();
          this.recordDetails.recordId("new");
        } else {
          this.rightHeader.children().removeClass('active');
          this.showRecordDetails();
          this.recordDetails.recordId(id);
          var selectedLi = this.unrankedList.elementsById[id];
          if (! selectedLi) return;
          selectedLi.addClass("selected");
        }
      }
    },

    selectedChildTableName: {
      afterChange: function(tableName) {this.recordDetails.selectedChildTableName(tableName)}
    },

    showRankedList: function() {
      this.recordDetails.hide();
      this.rankedList.show();
    },

    showRecordDetails: function() {
      this.rankedList.hide();
      this.recordDetails.show();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    },

    isInFirstColumn: function() {
      return (this.containingColumn.number === 0);
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
    }
  }
});
