//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Pages.Question', OldMonarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "question"}, function() {
      div({id: "subheader"}, function() {
        a({href: "javascript:void"}, "Back to Questions").ref('organizationLink').click(function() {
          History.pushState(null, null, this.question().organization().url());
          return false;
        });
      });

      div({id: "headline"}, function() {
        a({'class': "new button"}, function() {
          div({'class': "plus"}, "+");
          text("Add An Answer");
        }).ref('newAnswerLink')
          .click(function() {
            if (this.params().answerId === 'new') {
              this.answerDetails.createButton.click();
            } else {
              this.navigateToNewAnswerForm();
            }
          });
        a({'class': "facebook button"}, function() {
          div({'class': "logo"});
          span("Share");
        }).ref('facebookButton')
          .click(function() {
            this.question().shareOnFacebook();
          });

        a({'class': "twitter button", 'data-text': "Check it out yo!", href: ""}, function() {
          div({'class': "logo"});
          span("Tweet");
        }).ref('twitterButton');

        div({'class': "body"}).ref('body');
        textarea({name: "body", 'class': "body"}).ref("editableBody");
        subview('charsRemaining', Views.Components.CharsRemaining, { limit: 140 });
      }).ref('headline');

      div({id: "columns"}, function() {
        div(function() {
          for (var i = 1; i <= 4; i++) {
            div({'class': "column", id: "column" + i}, function() {
              div(function() {
                div({style: "height: 0"}, function() { raw("&nbsp;") }); // hack to allow textareas first
                template['column' + i]();
              });
            }).ref('column' + i);
          }
        });
      }).ref('columns');

      subview('spinner', Views.Components.Spinner);
    }).click(function(e) {
        if ($(e.target).is('a,textarea,li,li *,#answer-details,#answer-details *')) return;
        if (window.getSelection().toString() !== "") return;
        History.replaceState(null, null, this.question().url());
      });
  }},

  column1: function() { with(this.builder) {
    h2({id: "details-header"}, "Details").ref('detailsHeader');
    textarea({name: 'details', 'class': "details"}).ref("editableDetails");
    a({'class': 'update button'}, "Save").ref('updateButton').click('update');
    a({'class': 'cancel button'}, "Cancel").ref('cancelEditButton').click('cancelEdit');

    div({'class': "non-editable"}, function() {
      div({'class': 'details'}).ref('details');

      a({'class': "edit"}, "✎ edit").ref('editButton').click('edit');
      a({'class': "destroy"}, "✕ delete").ref('destroyButton').click('destroy');
    });

    div({'class': 'creator'}, function() {
      subview('avatar', Views.Components.Avatar, {imageSize: 34});
      div({'class': 'name'}).ref('creatorName');
      div({'class': 'date'}).ref('createdAt');
    }).ref('creator');

    subview('comments', Views.Pages.Question.Comments);
  }},

  column2: function() { with(this.builder) {
    a({'class': "full-screen link"}, "Full Screen").click(function() {
      History.replaceState(null, null, this.question().fullScreenUrl());
    });
    h2("Current Consensus");
    subview('currentConsensus', Views.Pages.Question.CurrentConsensus);
  }},

  column3: function() { with(this.builder) {
    a({id: "back-to-your-ranking", 'class': "link"}, "← Back").ref('backLink').click(function() {
      History.replaceState(null,null,this.question().url());
    });
    h2("Your Ranking").ref('rankedAnswersHeader');
    h2("Answer Details").ref('answerDetailsHeader');

    div({id: "rankings-and-details"}, function() {
      subview('answerDetails', Views.Pages.Question.AnswerDetails);
      subview('rankedAnswers', Views.Pages.Question.RankedAnswers);
    });
  }},

  column4: function() {
    this.builder.subview('votes', Views.Pages.Question.Votes);
  },

  viewProperties: {
    fixedHeight: true,

    attach: function($super) {
      $super();

      this.charsRemaining.field(this.editableBody);
      this.editableBody.elastic();
      this.editableDetails.elastic();
      this.editableBody.bind('elastic', this.hitch('adjustColumnTop'));
      this.editableDetails.bind('elastic', this.hitch('adjustCommentsHeight'));
      $(window).resize(this.hitch('adjustCommentsHeight'));

      Application.onCurrentUserChange(function(currentUser) {
        if (this.question()) {
          this.showOrHideMutateButtons();
        }

        var params = this.params();
        if (params) {
          return currentUser
            .rankings()
            .where({questionId: params.questionId})
            .fetch()
            .success(this.hitch('populateContentAfterFetch', params));
        }
      }, this);

      Application.twitterInitialized(function() {
        twttr.events.bind('tweet', this.hitch('recordTweet'));
      }, this);
    },

    afterShow: function() {
      this.adjustColumnTop();
    },

    params: {
      change: function(params, oldParams) {
        this.populateContentBeforeFetch(params);
        return this.fetchData(params, oldParams)
          .success(this.hitch('populateContentAfterFetch', params));
      }
    },

    populateContentBeforeFetch: function(params) {
      var question = Question.find(params.questionId);
      if (question) {
        this.question(question);
        this.currentConsensus.answers(question.answers());
      } else {
        this.loading(true);
      }

      if (params.voterId || params.answerId) {
        this.backLink.show();
      } else {
        this.backLink.hide();
      }

      var voterId;

      if (params.answerId) {
        this.showAnswerDetails();
        var answer = Answer.find(params.answerId);
        if (answer) {
          this.currentConsensus.selectedAnswer(answer);
          this.answerDetails.answer(answer);
        }
      } else {
        this.answerDetails.removeClass('active');
        this.currentConsensus.selectedAnswer(null);
        voterId = params.voterId || Application.currentUserId();
        this.rankedAnswers.sortingEnabled(!voterId || voterId === Application.currentUserId());
        this.populateRankedAnswersHeader(voterId);
      }

      if (params.answerId === 'new') {
        this.newAnswerLink.addClass('active');
      } else {
        this.newAnswerLink.removeClass('active');
      }

      this.votes.selectedVoterId(voterId);
    },

    fetchData: function(params, oldParams) {
      var relationsToFetch = [];

      if (!oldParams || params.questionId !== oldParams.questionId) {
        if (!Question.find(params.questionId)) relationsToFetch.push(Question.where({id: params.questionId}).join(User, { creatorId: 'User.id' })); // question
        relationsToFetch.push(Answer.where({questionId: params.questionId}).join(User, { creatorId: 'User.id' })); // answers
        relationsToFetch.push(Vote.where({questionId: params.questionId}).join(User)); // votes
        relationsToFetch.push(Application.currentUser().rankings().where({questionId: params.questionId})); // current user's rankings
        relationsToFetch.push(QuestionComment.where({questionId: params.questionId}).join(User, { creatorId: 'User.id' })); // question comments and commenters

        this.comments.loading(true);
        this.votes.loading(true);
      }

      if (params.voterId) {
        relationsToFetch.push(Ranking.where({questionId: params.questionId, userId: params.voterId})); // additional rankings
      }

      if (params.answerId && params.answerId !== "new") {
        relationsToFetch.push(AnswerComment.where({answerId: params.answerId}).join(User, { creatorId: 'User.id' })); // answer comments and commenters
        this.answerDetails.loading(true);
      } else {
        this.rankedAnswers.loading(true);
      }

      return Server.fetch(relationsToFetch);
    },

    populateContentAfterFetch: function(params) {
      if (!_.isEqual(params, this.params())) return;

      this.loading(false);
      this.rankedAnswers.loading(false);
      this.answerDetails.loading(false);
      this.votes.loading(false);
      this.comments.loading(false);

      var question = Question.find(params.questionId);

      if (!question) {
        History.pushState(null, null, Application.currentUser().defaultOrganization().url());
        return;
      }

      this.question(question);
      this.currentConsensus.answers(question.answers());
      this.votes.votes(question.votes());
      this.comments.comments(question.comments());

      if (params.answerId) {
        var answer = Answer.find(params.answerId);
        this.currentConsensus.selectedAnswer(answer);
        this.answerDetails.answer(answer);
        if (answer) {
          this.answerDetails.comments.comments(answer.comments());
        } else if (params.answerId === 'new') {
          this.answerDetails.showNewForm();
        } else {
          History.replaceState(null, null, question.url());
        }
      } else {
        var rankings = Ranking.where({questionId: params.questionId, userId: params.voterId || Application.currentUserId()});
        this.showRankedAnswers();
        this.populateRankedAnswersHeader(params.voterId);
        this.rankedAnswers.rankings(rankings);
      }

      if (params.fullScreen) this.enterFullScreenMode();
    },

    question: {
      change: function(question) {
        this.avatar.user(question.creator());
        this.body.bindMarkdown(question, 'body');

        var organization = question.organization();
        Application.currentOrganization(organization);
        if (organization.isPublic()) {
          this.facebookButton.show();
          this.twitterButton.show();
        } else {
          this.facebookButton.hide();
          this.twitterButton.hide();
        }

        this.details.bindMarkdown(question, 'details');
        this.comments.comments(question.comments());
        this.avatar.user(question.creator());
        this.creatorName.bindText(question.creator(), 'fullName');
        this.createdAt.text(question.formattedCreatedAt());

        this.showOrHideMutateButtons();
        this.cancelEdit();

        this.registerInterest(question, 'onUpdate', this.handleQuestionUpdate);
        this.handleQuestionUpdate();
        this.registerInterest(question, 'onDestroy', this.bind(function() {
          if (this.is(':visible')) History.pushState(null, null, Application.currentOrganization().url());
        }));

        this.adjustCommentsHeight();
        question.trackView();
      }
    },

    edit: function() {
      this.addClass('edit-mode');
      this.editableBody.focus();
      this.editableBody.val(this.question().body()).keyup();
      this.editableDetails.val(this.question().details()).keyup();
      this.adjustColumnTop();
    },

    cancelEdit: function() {
      this.removeClass('edit-mode');
      this.showOrHideDetails();
      this.adjustColumnTop();
    },

    update: function(e) {
      e.preventDefault();
      if ($.trim(this.editableBody.val()) === "") return false;
      if (this.editableBody.val().length > 140) return false;
      this.question().update({body: this.editableBody.val(), details: this.editableDetails.val()}).success(this.bind(function(question) {
        question.trackUpdate();
        this.cancelEdit();
      }));
    },

    destroy: function() {
      if (window.confirm("Are you sure you want to delete this question? It can't be undone.")) {
        this.question().destroy();
      }
    },

    populateRankedAnswersHeader: function(voterId) {
      if (!voterId || voterId === Application.currentUserId()) {
        this.rankedAnswersHeader.text('Your Ranking');
        return;
      }

      var voter = User.find(voterId);
      if (voter) this.rankedAnswersHeader.text(voter.fullName() + "'s Ranking");
    },

    showRankedAnswers: function() {
      this.answerDetailsHeader.hide();
      this.rankedAnswersHeader.show();
      this.answerDetails.removeClass('active');
    },

    showAnswerDetails: function() {
      this.rankedAnswersHeader.hide();
      this.answerDetailsHeader.show();
      this.answerDetails.addClass('active');
    },

    handleQuestionUpdate: function() {
      this.showOrHideDetails();
      this.adjustColumnTop();
      this.updateTwitterIntentsUrl();
    },

    updateTwitterIntentsUrl: function() {
      var urlAndCode = this.question().twitterIntentsUrlAndCode();
      this.twitterButton.attr('href', urlAndCode[0]);
      this.twitterShareCode = urlAndCode[1];
    },

    recordTweet: function() {
      this.question().recordShare('twitter', this.twitterShareCode);
      this.updateTwitterIntentsUrl();
      mpq.push(['track', 'Tweet', _.extend(this.question().mixpanelProperties(), {type: "Question"})])
    },

    showOrHideDetails: function() {
      if (this.question().details()) {
        this.details.show()
      } else {
        this.details.hide()
      }
    },

    navigateToNewAnswerForm: function() {
      History.replaceState(null, null, this.question().newAnswerUrl());
    },

    adjustColumnTop: function() {
      this.columns.css('top', this.columnTopPosition());
      this.adjustCommentsHeight();
    },

    columnTopPosition: function() {
      var bigLineHeight = Application.lineHeight * 1.5;

      var distanceFromHeadline = Application.lineHeight * 2;
      var subheaderHeight = this.headline.position().top;
      var quantizedHeadlineHeight = Math.round(this.headline.height() / bigLineHeight) * bigLineHeight;

      return Math.round(quantizedHeadlineHeight + distanceFromHeadline + subheaderHeight);
    },

    adjustCommentsHeight: function() {
      this.comments.fillVerticalSpace(this.columns);
    },

    showOrHideMutateButtons: function() {
      if (this.question().editableByCurrentUser()) {
        this.addClass('mutable');
        this.column1.addClass('mutable');
      } else {
        this.removeClass('mutable');
        this.column1.removeClass('mutable');
      }
    },

    enterFullScreenMode: function() {
      if (this.params().answerId) {
        Application.fullScreenAnswer.show();
        Application.fullScreenAnswer.answer(this.answerDetails.answer());
      } else {
        Application.fullScreenConsensus.show();
        Application.fullScreenConsensus.question(this.question());
      }
    },

    loading: {
      change: function(loading) {
        if (loading) {
          this.headline.hide();
          this.columns.hide();
          this.spinner.show();
        } else {
          this.headline.show();
          this.columns.show();
          this.spinner.hide();
        }
      }
    }
  }
});
