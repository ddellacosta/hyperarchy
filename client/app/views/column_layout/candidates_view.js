_.constructor("Views.ColumnLayout.CandidatesView", View.Template, {
  content: function() {with(this.builder) {
    div({'class': "candidates columnView"}, function() {

      div({'class': "left header"}, function() {
        span("Top Answers");
        button("New Answer", {'class': "create"}).
          ref("createRecordLink").
          click("showCreateCandidateForm");
      }).ref("leftHeader");

      div({'class': "right header"}, function() {
        span("Your Ranking").ref("ownRankingHeader");
        div(function() {
          span().ref("otherRankingUserName");
          button("back", {'class': "back"}).click("showOwnRanking");
        }).ref("otherRankingHeader");
        div(function() {
          span("Answer Details");
          button("back", {'class': "back"}).click("showOwnRanking");
        }).ref("detailsHeader");
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
      this.recordDetails.containingView = this;
      this.rankedList.containingView = this;
      this.rankedList.setupSortable();
    },

    state: {
      afterChange: function(state, oldState) {
        try {
          var mainRelationIsNew = (! oldState)
                                   || (state.parentRecordId  !== oldState.parentRecordId)
                                   || (state.parentTableName !== oldState.parentTableName);
          if (mainRelationIsNew) {
            this.startLoading();
            this.mainRelation = this.parseMainRelation(state);
            this.votesRelation = this.mainRelation.joinThrough(Election).joinThrough(Vote).
                                   orderBy(Vote.updatedAt.desc());
            this.rankingsUserId = state.userId || Application.currentUserId;
            this.rankingsRelation = this.mainRelation.joinThrough(Ranking).
                                      where({userId: this.rankingsUserId}).
                                      orderBy(Ranking.position.desc());
            Server.fetch([this.mainRelation, this.votesRelation, this.rankingsRelation]).
              onSuccess(this.populateContent, this);
            return;
          }

          var rankingRelationIsNew = (! oldState) || (state.userId !== oldState.userId);
          if (rankingRelationIsNew) {
            this.rankedList.startLoading();
            this.rankingsUserId = state.userId || Application.currentUserId;
            this.rankingsRelation = this.mainRelation.joinThrough(Ranking).
                                      where({userId: this.rankingsUserId}).
                                      orderBy(Ranking.position.desc());
            Server.fetch([this.rankingsRelation]).
              onSuccess(this.populateContent, this);
            return;
          }
        } catch (invalidState) {this.containingColumn.handleInvalidState(invalidState)}
        this.populateContent();
      }
    },

    adjustHeight: function() {
      this.leftSection.fillContainingVerticalSpace();
      this.rightSection.fillContainingVerticalSpace();
      this.rankedList.adjustHeight();
    },

    showCreateCandidateForm: function() {
      this.containingColumn.pushState({recordId: "new", userId: ""});
    },

    showOwnRanking: function() {
      this.containingColumn.pushState({recordId: "", userId: ""});
    },

    // private

    parseMainRelation: function(state) {
      if (state.parentRecordId) {
        return Candidate.where({electionId: state.parentRecordId})
      } else {
        return Candidate.where({id: state.recordId});
      }
    },

    populateContent: function() {
      this.unrankedList.relation(this.mainRelation);
      this.rankedList.rankingsRelation(this.rankingsRelation);
      this.containingColumn.containingList.usersList.relation(this.votesRelation);
      this.recordDetails.recordId(this.state().recordId);
      this.recordDetails.selectedChildTableName(this.state().childTableName);
      this.showSelectedElements();
      if (this.isInFirstColumn()) this.setCurrentOrganizationId();
      this.stopLoading();
    },

    showSelectedElements: function() {
      this.unrankedList.children().removeClass("selected");
      this.rightHeader.children().hide();
      var recordId = this.state().recordId;
      var userId = this.state().userId;
      if (userId && userId !== Application.currentUserId) {
        this.recordDetails.hide();
        this.rankedList.show();
        this.otherRankingUserName.html(User.find(userId).fullName() + "'s Ranking");
        this.ownRankingHeader.hide();
        this.detailsHeader.hide();
        this.otherRankingHeader.show();
      } else if (recordId) {
        this.rankedList.hide();
        this.recordDetails.show();
        this.recordDetails.recordId(recordId);
        this.otherRankingHeader.hide();
        this.ownRankingHeader.hide();
        this.detailsHeader.show();
        if (recordId === "new") {
          this.createRecordLink.addClass('selected');
        } else {
          var li = this.unrankedList.elementsById[recordId];
          if (li) li.addClass("selected");
        }
      } else {
        this.recordDetails.hide();
        this.rankedList.show();
        this.otherRankingHeader.hide();
        this.detailsHeader.hide();
        this.ownRankingHeader.show();
        this.ownRankingHeader.addClass('selected');
      }
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
      this.rankedList.stopLoading();
    },

    isInFirstColumn: function() {return (this.containingColumn.number === 0)}
  }
});
