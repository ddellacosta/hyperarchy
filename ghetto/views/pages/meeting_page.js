_.constructor('Views.Pages.Meeting', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "meeting"}, function() {
      div({id: "subheader"}, function() {
        a({href: "javascript:void"}, "Back to Meetings").ref('teamLink').click(function() {
          History.pushState(null, null, this.meeting().team().url());
          return false;
        });
      });

      div({id: "headline"}, function() {
        a({'class': "new button"}, function() {
          div({'class': "plus"}, "+");
          text("Add An AgendaItem");
        }).ref('newAgendaItemLink')
          .click(function() {
            if (this.params().agendaItemId === 'new') {
              this.agendaItemDetails.createButton.click();
            } else {
              this.navigateToNewAgendaItemForm();
            }
          });
        a({'class': "facebook button"}, function() {
          div({'class': "logo"});
          span("Share");
        }).ref('facebookButton')
          .click(function() {
            this.meeting().shareOnFacebook();
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
        if ($(e.target).is('a,textarea,li,li *,#agendaItem-details,#agendaItem-details *')) return;
        if (window.getSelection().toString() !== "") return;
        History.replaceState(null, null, this.meeting().url());
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

    subview('notes', Views.Pages.Meeting.Notes);
  }},

  column2: function() { with(this.builder) {
    a({'class': "full-screen link"}, "Full Screen").click(function() {
      History.replaceState(null, null, this.meeting().fullScreenUrl());
    });
    h2("Current Consensus");
    subview('currentConsensus', Views.Pages.Meeting.CurrentConsensus);
  }},

  column3: function() { with(this.builder) {
    a({id: "back-to-your-ranking", 'class': "link"}, "← Back").ref('backLink').click(function() {
      History.replaceState(null,null,this.meeting().url());
    });
    h2("Your Ranking").ref('rankedAgendaItemsHeader');
    h2("AgendaItem Details").ref('agendaItemDetailsHeader');

    div({id: "rankings-and-details"}, function() {
      subview('agendaItemDetails', Views.Pages.Meeting.AgendaItemDetails);
      subview('rankedAgendaItems', Views.Pages.Meeting.RankedAgendaItems);
    });
  }},

  column4: function() {
    this.builder.subview('votes', Views.Pages.Meeting.Votes);
  },

  viewProperties: {
    fixedHeight: true,

    attach: function($super) {
      $super();

      this.charsRemaining.field(this.editableBody);
      this.editableBody.elastic();
      this.editableDetails.elastic();
      this.editableBody.bind('elastic', this.hitch('adjustColumnTop'));
      this.editableDetails.bind('elastic', this.hitch('adjustNotesHeight'));
      $(window).resize(this.hitch('adjustNotesHeight'));

      Application.onCurrentUserChange(function(currentUser) {
        if (this.meeting()) {
          this.showOrHideMutateButtons();
        }

        var params = this.params();
        if (params) {
          return currentUser
            .rankings()
            .where({meetingId: params.meetingId})
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
      var meeting = Meeting.find(params.meetingId);
      if (meeting) {
        this.meeting(meeting);
        this.currentConsensus.agendaItems(meeting.agendaItems());
      } else {
        this.loading(true);
      }

      if (params.voterId || params.agendaItemId) {
        this.backLink.show();
      } else {
        this.backLink.hide();
      }

      var voterId;

      if (params.agendaItemId) {
        this.showAgendaItemDetails();
        var agendaItem = AgendaItem.find(params.agendaItemId);
        if (agendaItem) {
          this.currentConsensus.selectedAgendaItem(agendaItem);
          this.agendaItemDetails.agendaItem(agendaItem);
        }
      } else {
        this.agendaItemDetails.removeClass('active');
        this.currentConsensus.selectedAgendaItem(null);
        voterId = params.voterId || Application.currentUserId();
        this.rankedAgendaItems.sortingEnabled(!voterId || voterId === Application.currentUserId());
        this.populateRankedAgendaItemsHeader(voterId);
      }

      if (params.agendaItemId === 'new') {
        this.newAgendaItemLink.addClass('active');
      } else {
        this.newAgendaItemLink.removeClass('active');
      }

      this.votes.selectedVoterId(voterId);
    },

    fetchData: function(params, oldParams) {
      var relationsToFetch = [];

      if (!oldParams || params.meetingId !== oldParams.meetingId) {
        if (!Meeting.find(params.meetingId)) relationsToFetch.push(Meeting.where({id: params.meetingId}).join(User).on(User.id.eq(Meeting.creatorId))); // meeting
        relationsToFetch.push(AgendaItem.where({meetingId: params.meetingId}).join(User).on(AgendaItem.creatorId.eq(User.id))); // agendaItems
        relationsToFetch.push(Vote.where({meetingId: params.meetingId}).joinTo(User)); // votes
        relationsToFetch.push(Application.currentUser().rankings().where({meetingId: params.meetingId})); // current user's rankings
        relationsToFetch.push(MeetingNote.where({meetingId: params.meetingId}).join(User).on(MeetingNote.creatorId.eq(User.id))); // meeting notes and noters

        this.notes.loading(true);
        this.votes.loading(true);
      }

      if (params.voterId) {
        relationsToFetch.push(Ranking.where({meetingId: params.meetingId, userId: params.voterId})); // additional rankings
      }

      if (params.agendaItemId && params.agendaItemId !== "new") {
        relationsToFetch.push(AgendaItemNote.where({agendaItemId: params.agendaItemId}).join(User).on(AgendaItemNote.creatorId.eq(User.id))); // agendaItem notes and noters
        this.agendaItemDetails.loading(true);
      } else {
        this.rankedAgendaItems.loading(true);
      }

      return Server.fetch(relationsToFetch);
    },

    populateContentAfterFetch: function(params) {
      if (!_.isEqual(params, this.params())) return;

      this.loading(false);
      this.rankedAgendaItems.loading(false);
      this.agendaItemDetails.loading(false);
      this.votes.loading(false);
      this.notes.loading(false);

      var meeting = Meeting.find(params.meetingId);

      if (!meeting) {
        History.pushState(null, null, Application.currentUser().defaultTeam().url());
        return;
      }

      this.meeting(meeting);
      this.currentConsensus.agendaItems(meeting.agendaItems());
      this.votes.votes(meeting.votes());
      this.notes.notes(meeting.notes());

      if (params.agendaItemId) {
        var agendaItem = AgendaItem.find(params.agendaItemId);
        this.currentConsensus.selectedAgendaItem(agendaItem);
        this.agendaItemDetails.agendaItem(agendaItem);
        if (agendaItem) {
          this.agendaItemDetails.notes.notes(agendaItem.notes());
        } else if (params.agendaItemId === 'new') {
          this.agendaItemDetails.showNewForm();
        } else {
          History.replaceState(null, null, meeting.url());
        }
      } else {
        var rankings = Ranking.where({meetingId: params.meetingId, userId: params.voterId || Application.currentUserId()});
        this.showRankedAgendaItems();
        this.populateRankedAgendaItemsHeader(params.voterId);
        this.rankedAgendaItems.rankings(rankings);
      }

      if (params.fullScreen) this.enterFullScreenMode();
    },

    meeting: {
      change: function(meeting) {
        this.avatar.user(meeting.creator());
        this.body.bindMarkdown(meeting, 'body');

        var team = meeting.team();
        Application.currentTeam(team);
        if (team.isPublic()) {
          this.facebookButton.show();
          this.twitterButton.show();
        } else {
          this.facebookButton.hide();
          this.twitterButton.hide();
        }

        this.details.bindMarkdown(meeting, 'details');
        this.notes.notes(meeting.notes());
        this.avatar.user(meeting.creator());
        this.creatorName.bindText(meeting.creator(), 'fullName');
        this.createdAt.text(meeting.formattedCreatedAt());

        this.showOrHideMutateButtons();
        this.cancelEdit();

        this.registerInterest(meeting, 'onUpdate', this.handleMeetingUpdate);
        this.handleMeetingUpdate();
        this.registerInterest(meeting, 'onDestroy', this.bind(function() {
          if (this.is(':visible')) History.pushState(null, null, Application.currentTeam().url());
        }));

        this.adjustNotesHeight();
        meeting.trackView();
      }
    },

    edit: function() {
      this.addClass('edit-mode');
      this.editableBody.focus();
      this.editableBody.val(this.meeting().body()).keyup();
      this.editableDetails.val(this.meeting().details()).keyup();
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
      this.meeting().update({body: this.editableBody.val(), details: this.editableDetails.val()}).success(this.bind(function(meeting) {
        meeting.trackUpdate();
        this.cancelEdit();
      }));
    },

    destroy: function() {
      if (window.confirm("Are you sure you want to delete this meeting? It can't be undone.")) {
        this.meeting().destroy();
      }
    },

    populateRankedAgendaItemsHeader: function(voterId) {
      if (!voterId || voterId === Application.currentUserId()) {
        this.rankedAgendaItemsHeader.text('Your Ranking');
        return;
      }

      var voter = User.find(voterId);
      if (voter) this.rankedAgendaItemsHeader.text(voter.fullName() + "'s Ranking");
    },

    showRankedAgendaItems: function() {
      this.agendaItemDetailsHeader.hide();
      this.rankedAgendaItemsHeader.show();
      this.agendaItemDetails.removeClass('active');
    },

    showAgendaItemDetails: function() {
      this.rankedAgendaItemsHeader.hide();
      this.agendaItemDetailsHeader.show();
      this.agendaItemDetails.addClass('active');
    },

    handleMeetingUpdate: function() {
      this.showOrHideDetails();
      this.adjustColumnTop();
      this.updateTwitterIntentsUrl();
    },

    updateTwitterIntentsUrl: function() {
      var urlAndCode = this.meeting().twitterIntentsUrlAndCode();
      this.twitterButton.attr('href', urlAndCode[0]);
      this.twitterShareCode = urlAndCode[1];
    },

    recordTweet: function() {
      this.meeting().recordShare('twitter', this.twitterShareCode);
      this.updateTwitterIntentsUrl();
      mpq.push(['track', 'Tweet', _.extend(this.meeting().mixpanelProperties(), {type: "Meeting"})])
    },

    showOrHideDetails: function() {
      if (this.meeting().details()) {
        this.details.show()
      } else {
        this.details.hide()
      }
    },

    navigateToNewAgendaItemForm: function() {
      History.replaceState(null, null, this.meeting().newAgendaItemUrl());
    },

    adjustColumnTop: function() {
      this.columns.css('top', this.columnTopPosition());
      this.adjustNotesHeight();
    },

    columnTopPosition: function() {
      var bigLineHeight = Application.lineHeight * 1.5;

      var distanceFromHeadline = Application.lineHeight * 2;
      var subheaderHeight = this.headline.position().top;
      var quantizedHeadlineHeight = Math.round(this.headline.height() / bigLineHeight) * bigLineHeight;

      return Math.round(quantizedHeadlineHeight + distanceFromHeadline + subheaderHeight);
    },

    adjustNotesHeight: function() {
      this.notes.fillVerticalSpace(this.columns);
    },

    showOrHideMutateButtons: function() {
      if (this.meeting().editableByCurrentUser()) {
        this.addClass('mutable');
        this.column1.addClass('mutable');
      } else {
        this.removeClass('mutable');
        this.column1.removeClass('mutable');
      }
    },

    enterFullScreenMode: function() {
      if (this.params().agendaItemId) {
        Application.fullScreenAgendaItem.show();
        Application.fullScreenAgendaItem.agendaItem(this.agendaItemDetails.agendaItem());
      } else {
        Application.fullScreenConsensus.show();
        Application.fullScreenConsensus.meeting(this.meeting());
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
