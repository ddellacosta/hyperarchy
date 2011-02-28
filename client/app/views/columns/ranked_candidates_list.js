_.constructor("Views.Columns.RankedCandidatesList", View.Template, {
  content: function() { with(this.builder) {
    ol({'class': "ranked candidatesList"}, function() {
      li({'class': "dragTargetExplanation"}, function() {
        span(function() {
          raw("Drag answers you <em>like</em> here, <br /> with the best at the top.")
        });
      }).ref('goodCandidatesExplanation');

      li({'class': "separator"}, function() {
        div({'class': "up"}, "good ideas");
        div({'class': "down"}, "bad ideas");
      }).ref('separator');

      li({'class': "dragTargetExplanation"}, function() {
        span(function() {
          raw("Drag answers you <em>dislike</em> here, <br /> with the worst at the bottom.")
        });
      }).ref('badCandidatesExplanation');
    }).ref('rankedCandidatesList');
  }},

  viewProperties: {
    propertyAccessors: ["election"],

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle();
      this.rankedCandidatesList.sortable({
        tolerance: "pointer",
        update: this.hitch('handleUpdate'),
        receive: this.hitch('handleReceive'),
        sort: this.hitch('handleSort')
      });

      var returnFalse = function(e) { return false; };
      this.separator.mousedown(returnFalse);
      this.goodCandidatesExplanation.mousedown(returnFalse);
      this.badCandidatesExplanation.mousedown(returnFalse);

      var adjustHeight = this.hitch('adjustHeight');
      _.defer(adjustHeight);
      $(window).resize(adjustHeight);
    },

    election: {
      afterChange: function(election) {
        if (this.rankingsUser()) {
          this.assignRankingsRelation();
        }
      }
    },

    organization: function() {
      return this.election().organization();
    },

    rankingsUser: {
      afterChange: function(rankingsUser) {
        this.assignRankingsRelation();
      }
    },

    assignRankingsRelation: function() {
      if (this.rankingsUser().isCurrent()) {
        this.rankingsUserName.html("Your Ranking");
        this.backLink.hide();
        this.removeClass('otherUser');
        this.rankedCandidatesList.sortable('enable');
      } else {
        this.rankingsUserName.html(htmlEscape(this.rankingsUser().fullName()) + "'s Ranking");
        this.backLink.show();
        this.adjustHeight(); // in case the header changed height from assigning the ranker
        this.rankedCandidatesList.sortable('disable');
        this.addClass('otherUser');
      }

      this.rankingsRelation(this.election().rankingsForUser(this.rankingsUser()));
    },

    rankingsRelation: {
      afterChange: function(rankingsRelation) {
        this.subscriptions.destroy();
        this.populateRankings();
        this.subscribeToRankingsChanges();
      }
    },

    populateRankings: function() {
      this.empty();

      this.rankingsRelation().each(function(ranking) {
        var li = Views.RankedCandidateLi.toView({ranking: ranking, containingList: this});
        li.stopLoading();

        if (ranking.position() > 0) {
          this.goodCandidatesExplanation.hide();
          this.separator.before(li);
        } else {
          this.badCandidatesExplanation.hide();
          this.rankedCandidatesList.append(li);
        }
      }, this);
      this.subscriptions.add(this.rankingsRelation().onRemove(function(ranking) {
        this.findLi(ranking.candidate()).remove();
      }, this));
    },

    subscribeToRankingsChanges: function() {
      var rankings = this.rankingsRelation();

      this.subscriptions.add(rankings.onInsert(function(ranking, index) {
        this.insertRankedCandidateLi(ranking, index);
      }, this));

      this.subscriptions.add(rankings.onUpdate(function(ranking, changes, index) {
        this.insertRankedCandidateLi(ranking, index);
      }, this));
    },

    insertRankedCandidateLi: function(ranking, index) {
      var li = this.findOrCreateRankedCandidateLi(ranking).detach();
      if (ranking.position() < 0) index++; // to skip the separator element
      var precedes = this.rankedCandidatesList.children("li.candidate,li.separator").eq(index);
      if (precedes.length > 0) {
        precedes.before(li);
      } else {
        this.rankedCandidatesList.append(li);
      }
      li.stopLoading();
      this.showOrHideDragTargetExplanations();
    },

    empty: function() {
      this.rankedCandidatesList.find("li.candidate").each(function() {
        $(this).view().remove();
      });
      this.find('.dragTargetExplanation').show();
      this.adjustDragTargetExplanationHeights();
    },

    handleReceive: function(event, ui) {
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var previouslyRankedLi = this.findPreviouslyRankedLi(candidate); // may have already been ranked before
      var rankedCandidateView = previouslyRankedLi ? previouslyRankedLi.detach() : Views.RankedCandidateLi.toView({candidate: candidate, containingList: this});
      this.findLi(candidate).replaceWith(rankedCandidateView); // replace the clone of the draggable li with a real view
    },

    handleUpdate: function(event, ui) {
      var candidate = Candidate.find(ui.item.attr('candidateId'));
      var rankedCandidateLi = this.findLi(candidate);

      this.organization().ensureCurrentUserCanParticipate()
        .onSuccess(function() {
          rankedCandidateLi.handleUpdate();
        }, this)
        .onFailure(function() {
          rankedCandidateLi.remove();
        }, this);
    },

    handleSort:  function(event, ui) {
      var placeholder = ui.placeholder;
      var beforeSeparator = placeholder.nextAll(".separator").length === 1;

      if (beforeSeparator && this.goodCandidatesExplanation.is(":visible")) {
        placeholder.hide();
      } else if (!beforeSeparator && this.badCandidatesExplanation.is(":visible")) {
        placeholder.hide();
      } else {
        placeholder.show();
      }
    },

    findOrCreateRankedCandidateLi: function(ranking) {
      return this.findPreviouslyRankedLi(ranking.candidate()) ||
        Views.RankedCandidateLi.toView({ranking: ranking, containingList: this});
    },

    findPreviouslyRankedLi: function(candidate) {
      var previouslyRankedLi = this.rankedCandidatesList.find("li.ranked.candidate[candidateId='" + candidate.id() + "']");
      return previouslyRankedLi.length > 0 ? previouslyRankedLi.view() : null;
    },

    findLi: function(candidate) {
      var li = this.rankedCandidatesList.find("li[candidateId='" + candidate.id() + "']");
      return li.view() ? li.view() : li;
    },

    adjustHeight: function() {
      this.adjustDragTargetExplanationHeights();
    },

    fadeIn: function($super) {
      $super();
      this.adjustHeight();
    },

    afterShow: function() {
      this.adjustHeight();
    },

    adjustDragTargetExplanationHeights: function() {
      var explanationHeight = (this.rankedCandidatesList.height() - this.separator.outerHeight()) / 2.1;
      this.find('.dragTargetExplanation').each(function() {
        var elt = $(this);
        elt.height(explanationHeight);
        elt.find('span').position({
          my: 'center center',
          at: 'center center',
          of: elt
        });
      });
    },
    
    hasPositiveRankings: function() {
      return this.separator.prevAll('.candidate').length > 0;
    },

    hasNegativeRankings: function() {
      return this.separator.nextAll('.candidate').length > 0;
    },

    showOrHideDragTargetExplanations: function() {
      if (this.hasPositiveRankings()) {
        this.goodCandidatesExplanation.hide();
      } else {
        this.goodCandidatesExplanation.show();
      }

      if (this.hasNegativeRankings()) {
        this.badCandidatesExplanation.hide();
      } else {
        this.badCandidatesExplanation.show();
      }

      this.adjustDragTargetExplanationHeights();
    },

    backToCurrentUserRankings: function(elt, event) {
      $.bbq.removeState('rankingsUserId');
      return false;
    }
  }
});