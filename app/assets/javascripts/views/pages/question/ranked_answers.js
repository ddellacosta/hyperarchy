//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Pages.Question.RankedAnswers', OldMonarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "ranked-answers"}, function() {
      ol(function() {
        li({id: "positive-drag-target"}, function() {
          span("Drag ideas you like here").ref('positiveDragExplanation');
        }).ref('positiveDragTarget');
        li({id: 'separator'}, function() {
          span({id: "agree"}, "⬆  Agree");
          span({id: "disagree"}, "Disagree ⬇");
        }).ref('separator');
        li({id: "negative-drag-target"},function() {
          span("Drag ideas you dislike here").ref('negativeDragExplanation');
        }).ref('negativeDragTarget');
      }).ref('list');

      subview('spinner', Views.Components.Spinner);
    });
  }},

  viewProperties: {
    initialize: function() {
      this.separator.data('position', 0);
      this.rankingsSubscriptions = new OldMonarch.SubscriptionBundle();

      var returnFalse = function() { return false; }
      this.positiveDragTarget.mousedown(returnFalse);
      this.negativeDragTarget.mousedown(returnFalse);
      this.separator.mousedown(returnFalse);
    },

    attach: function($super) {
      $super();
      this.list.sortable({
        items: "li",

        tolerance: 'pointer',
        update: this.hitch('handleListUpdate'),
        receive: this.hitch('handleListReceive'),
        sort: this.hitch('handleListSort'),
        beforeStop: this.hitch('handleListBeforeStop'),

        appendTo: "#question",
        helper: 'clone'
      });
    },

    populateList: function() {
      this.separator.detach();
      this.detachDragTargets();

      this.list.find('li.ranking').each(function() {
        $(this).view().remove();
      });
      this.list.empty();


      this.appendRankings(this.positiveRankings(), this.positiveDragTarget);
      this.list.append(this.separator);
      this.appendRankings(this.negativeRankings(), this.negativeDragTarget);
    },

    detachDragTargets: function() {
      this.positiveDragTarget.detach();
      this.negativeDragTarget.detach();
    },

    observeListUpdates: function() {


      this.rankingsSubscriptions.destroy();

//      this.rankingsSubscriptions.add(this.positiveRankings().onInsert(this.hitch('insertAtIndex')));
//      this.rankingsSubscriptions.add(this.positiveRankings().onUpdate(this.hitch('insertAtIndex')));
//      this.rankingsSubscriptions.add(this.negativeRankings().onInsert(this.hitch('insertAtIndex')));
//      this.rankingsSubscriptions.add(this.negativeRankings().onUpdate(this.hitch('insertAtIndex')));
//      this.rankingsSubscriptions.add(this.rankings().onRemove(this.hitch('removeRanking')));

      this.registerInterest('positiveRankings', this.positiveRankings(), 'onInsert', this.insertAtIndex);
      this.registerInterest('positiveRankings', this.positiveRankings(), 'onUpdate', this.insertAtIndex);
      this.registerInterest('negativeRankings', this.negativeRankings(), 'onInsert', this.insertAtIndex);
      this.registerInterest('negativeRankings', this.negativeRankings(), 'onUpdate', this.insertAtIndex);
      this.registerInterest('rankings', this.rankings(), 'onRemove', this.removeRanking);
    },

    handleListUpdate: function(event, ui) {
      if (ui.item.hasClass('ui-draggable')) return; // received from other list, handle there
      if (!ui.item.view()) return;
      
      this.detachDragTargets();
      ui.item.view().handleListDrop();
      this.showOrHideDragTargets();
    },

    handleListBeforeStop: function(event, ui) {
      if (!ui.item.hasClass('ranking')) return;
      var helper = ui.helper, rankingLi = ui.item.view()

      if (!rankingLi.ranking) return;
      var ranking = rankingLi.ranking;

      if (Math.abs(ui.originalPosition.left - ui.position.left) < helper.width() * .33) return;

      var clone = helper.clone();
      helper.replaceWith(clone);
      clone
        .addClass('highlight')
        .hide('puff', function() {
          clone.remove();
        });

      this.removeRanking(ranking)
      ranking.destroy();
    },

    handleListSort:  function(event, ui) {
      var placeholder = ui.placeholder;
      var beforeSeparator = placeholder.nextAll("#separator").length === 1;

      if (beforeSeparator && this.positiveDragTarget.is(":visible")) {
        placeholder.hide();
      } else if (!beforeSeparator && this.negativeDragTarget.is(":visible")) {
        placeholder.hide();
      } else {
        placeholder.show();
      }
    },

    currentUserCanRank: function() {
      return Application.currentOrganization().currentUserCanParticipate()
    },

    handleListReceive: function(event, ui) {
      var answer = ui.item.view().answer;
      if (this.currentUserCanRank()) {
        this.insertRankingLi(answer, { replace: this.list.find('li.ui-draggable') });
      } else {
        this.handleGuestRanking(answer);
      }
    },

    handleGuestRanking: function(answer) {
      var isPositive = (this.list.find('li.ui-draggable').nextAll("#separator").length > 0);

      if (isPositive) {
        this.positiveDragTarget.detach();
      } else {
        this.negativeDragTarget.detach();
      }

      Application.promptSignup()
        .success(function() {
          this.insertRankingLi(answer, {isPositive: isPositive});
        }, this)
        .invalid(function() {
          this.list.find('.answer').remove();
          this.showOrHideDragTargets();
        }, this);
    },

    insertRankingLi: function(answer, options) {
      var rankingLi = this.lisByAnswerId[answer.id()];

      if (rankingLi) {
        rankingLi.detach();
      } else {
        rankingLi = Views.Pages.Question.RankingLi.toView({answer: answer});
        this.lisByAnswerId[answer.id()] = rankingLi;
      }

      this.detachDragTargets();

      if (options.replace) {
        options.replace.replaceWith(rankingLi);
      } else {
        if (options.isPositive) {
          this.list.prepend(rankingLi);
        } else {
          this.list.append(rankingLi);
        }
      }

      rankingLi.handleListDrop();
      this.showOrHideDragTargets();
    },

    rankings: {
      change: function(rankingsRelation) {
        this.lisByAnswerId = {};
        this.populateList();
        this.observeListUpdates();
      }
    },

    sortingEnabled: {
      change: function(enabled) {
        if (enabled) {
          this.positiveDragExplanation.css('visibility', 'visible');
          this.negativeDragExplanation.css('visibility', 'visible');
        } else {
          this.positiveDragExplanation.css('visibility', 'hidden');
          this.negativeDragExplanation.css('visibility', 'hidden');
        }
      }
    },

    insertAtIndex: function(ranking, changesetOrIndex, index) {
      if (_.isNumber(changesetOrIndex)) index = changesetOrIndex;

      var li = this.findOrCreateLi(ranking)

      if (li.outstandingRequests > 0) return;

      li.detach();
      var lis = ranking.position() > 0 ? this.positiveLis() : this.negativeLis();
      var followingLi = lis.eq(index);

      if (followingLi.size() > 0) {
        li.insertBefore(followingLi);
      } else {
        if (ranking.position() > 0) {
          li.insertBefore(this.separator);
        } else {
          this.list.append(li);
        }
      }

      this.showOrHideDragTargets();
    },

    showOrHideDragTargets: function() {
      if (this.positiveLis().size() > 0) {
        this.positiveDragTarget.detach();
      } else {
        this.positiveDragTarget.detach().prependTo(this.list);
      }
      if (this.negativeLis().size() > 0) {
        this.negativeDragTarget.detach();
      } else {
        this.negativeDragTarget.detach().appendTo(this.list);
      }
    },

    removeRanking: function(ranking) {
      var answerId = ranking.answerId();
      var rankingLi = this.lisByAnswerId[answerId];
      if (rankingLi) rankingLi.remove();
      delete this.lisByAnswerId[answerId];
      this.showOrHideDragTargets();
    },

    positiveRankings: function() {
      return this.rankings().where(Ranking.position.gt(0))
    },

    negativeRankings: function() {
      return this.rankings().where(Ranking.position.lt(0))
    },

    positiveLis: function() {
      return this.separator.prevAll('li.ranking:not(.ui-sortable-placeholder)').reverse();
    },

    negativeLis: function() {
      return this.separator.nextAll('li.ranking:not(.ui-sortable-placeholder)');
    },

    findOrCreateLi: function(ranking) {
      var id = ranking.answerId();
      if (!this.lisByAnswerId[id]) this.lisByAnswerId[id] = Views.Pages.Question.RankingLi.toView({ranking: ranking});
      return this.lisByAnswerId[id];
    },

    appendRankings: function(rankings, dragTargetIfEmpty) {
      if (rankings.empty()) this.list.append(dragTargetIfEmpty);

      rankings.each(function(ranking) {
        this.list.append(this.findOrCreateLi(ranking));
      }, this);
    },

    loading: {
      change: function(loading) {
        if (loading) {
          this.list.hide();
          this.spinner.show();
        } else {
          this.list.show();
          this.spinner.hide();
        }
      }
    }
  }
});
