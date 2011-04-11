_.constructor("Views.ColumnLayout.CandidatesView", View.Template, {
  content: function() {with(this.builder) {
    div({'class': "candidates columnView"}, function() {

      div({'class': "left header"}, function() {
        a("Answers").
          ref("candidatesLink").
          click("showCandidates");
      }).ref("leftHeader");

      div({'class': "right header"}, function() {
        a("Your Ranking").
          ref("rankingLink").
          click("showOwnRanking");
//        a("New Answer").
//          ref("createRecordLink").
//          click("showCreateCandidateForm");
      }).ref("rightHeader");

      div({'class': "left section"}, function() {
        div({'class': "unranked recordsList"}, function() {
          subview('unrankedList', Views.SortedList);
          div({'class': "loading"}).ref("loading");
        }).ref("unrankedListContainer");
      }).ref("leftSection");

      div({'class': "right section"}, function() {
        subview('recordDetails', Views.ColumnLayout.CandidateDetails);
        div(function() {
          subview('rankedList', Views.ColumnLayout.RankedCandidatesList);
          subview('votesList', Views.SortedList, {
            rootAttributes: {'class': "votesList"}
          });
        });
      }).ref("rightSection");
    });
  }},

  viewProperties: {

    initialize: function() {
      this.unrankedList.buildElement = this.bind(function(record) {
        return Views.ColumnLayout.UnrankedCandidateLi.toView({
          record: record,
          containingView: this
        })});
      this.votesList.buildElement = this.bind(function(vote) {
        return Views.ColumnLayout.VoteLi.toView({
          vote: vote,
          containingView: this
        })});
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
          this.fetchRelations(state);
          return;
        }
        var rankingsUserId    = this.parseRankingsUserId(state);
        var oldRankingsUserId = this.parseRankingsUserId(oldState);
        if (rankingsUserId !== oldRankingsUserId) {
          this.fetchRankingRelation(state, rankingsUserId);
        }
        if (state.tableName === "votes") {
          this.selectedUserId(rankingsUserId);
        } else {
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
      this.containingColumn.pushState({tableName: "candidates", recordId: "new"});
    },

    showOwnRanking: function() {
      this.containingColumn.pushState({tableName: "candidates", recordId: ""});
    },

    showOtherRanking: function(rankingsUserId) {
      this.containingColumn.pushState({tableName: "votes", recordId: rankingsUserId});
    },

    showCandidates: function() {
      if (this.unrankedList.is(':visible')) return;
      this.containingColumn.pushState({tableName: "candidates", recordId: null});
    },

    // private

    fetchRelations: function(state) {
      this.startLoading();
      try {
        var mainRelation  = this.parseMainRelation(state);
        var votesRelation = mainRelation.joinThrough(Election).joinThrough(Vote);
        var rankingsRelation = mainRelation.joinThrough(Ranking).
                               where({userId: state.userId}).
                               orderBy(Ranking.position.desc());
        Server.fetch([
          mainRelation.join(User).on(Candidate.creatorId.eq(User.id)),
          rankingsRelation.joinTo(User),
          votesRelation
        ]).onSuccess(function() {
          this.unrankedList.relation(mainRelation);
          this.rankedList.rankingsRelation(rankingsRelation);
          this.votesList.relation(votesRelation);

          var rankingsUserId    = this.parseRankingsUserId(state);
          if (state.tableName === "votes") {
            this.selectedUserId(rankingsUserId);
          } else {
            this.selectedRecordId(state.recordId);
            this.selectedChildTableName(state.childTableName);
          }
          if (this.isInFirstColumn()) this.setCurrentOrganizationId();
          this.stopLoading();
        }, this);
      } catch (invalidState) {this.containingColumn.handleInvalidState(invalidState)}
    },

    fetchRankingRelation: function(state, rankingsUserId) {
      var mainRelation = this.parseMainRelation(state);
      var rankingsRelation = mainRelation.joinThrough(Ranking).
                             where({userId: rankingsUserId}).
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

    parseRankingsUserId: function(state) {
      if (state.tableName === "votes" && state.recordId) {
        return state.recordId;
      } else {
        return Application.currentUserId;
      }
    },

    selectedRecordId: {
      afterWrite: function(id) {
        this.unrankedList.show();
        this.unrankedList.children().removeClass("selected");
        this.leftHeader.children().removeClass('selected');
        this.rightHeader.children().removeClass('selected');
        this.candidatesLink.addClass('selected');

        if (! id) {
          this.recordDetails.hide();
          this.rankedList.show();
          this.votesList.show();
          this.rankingLink.addClass('selected');
        } else if (id === "new") {
          this.rankedList.hide();
          this.votesList.hide();
          this.recordDetails.show();
          this.recordDetails.recordId("new");
          this.createRecordLink.addClass('selected');
        } else {
          this.rankedList.hide();
          this.votesList.hide();
          this.recordDetails.show();
          this.recordDetails.recordId(id);
          var selectedLi = this.unrankedList.elementsById[id];
          if (! selectedLi) return;
          selectedLi.addClass("selected");
        }
      }
    },

    selectedUserId: {
      afterWrite: function(id) {
        if (! id) id = Application.currentUserId;
        this.recordDetails.hide();
        this.rankedList.show();
        this.votesList.show();
        this.votesList.children().removeClass("selected");
        this.rightHeader.children().removeClass('selected');
        this.rankingLink.addClass('selected');
        var selectedLi = this.votesList.find('[userId=' + id + ']');
        if (! selectedLi) return;
        selectedLi.addClass("selected");
      }
    },

    selectedChildTableName: {
      afterChange: function(tableName) {this.recordDetails.selectedChildTableName(tableName)}
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    },

    startLoading: function() {
      this.loading.show();
      this.recordDetails.startLoading();
    },

    stopLoading: function() {
      this.loading.hide();
      this.recordDetails.stopLoading();
      this.adjustHeight();
    },

    isInFirstColumn: function() {return (this.containingColumn.number === 0)}
  }
});
