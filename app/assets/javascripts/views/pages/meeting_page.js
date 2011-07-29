_.constructor('Views.Pages.Meeting', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "meeting"}, function() {
      div({id: "subheader"}, function() {
        a({href: "javascript:void"}, "Team Dashboard").ref('teamLink').click(function() {
          History.pushState(null, null, this.meeting().team().url());
          return false;
        });
        h2().ref('body');
      });

      div({id: "columns"}, function() {
        div(function() {
          for (var i = 1; i <= 3; i++) {
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
        if ($(e.target).is('a,textarea,li,li *,#agenda-item-details,#agenda-item-details *')) return;
        if (window.getSelection().toString() !== "") return;
        History.replaceState(null, null, this.meeting().url());
      });
  }},

  column1: function() { with(this.builder) {
    a({'class': "new button"}, function() {
      div({'class': "plus"}, "+");
      text("New Item");
    }).ref('newAgendaItemLink')
      .click(function() {
        if (this.params().agendaItemId === 'new') {
          this.agendaItemDetails.createButton.click();
        } else {
          this.navigateToNewAgendaItemForm();
        }
      });
    h2("Collective Agenda");
    subview('currentConsensus', Views.Pages.Meeting.CurrentConsensus);
  }},

  column2: function() { with(this.builder) {
    a({id: "back-to-your-ranking", 'class': "link"}, "← Back").ref('backLink').click(function() {
      History.replaceState(null,null,this.meeting().url());
    });
    h2("").ref('rankedAgendaItemsHeader');

    div({id: "rankings-and-details"}, function() {
      subview('agendaItemDetails', Views.Pages.Meeting.AgendaItemDetails);
      subview('rankedAgendaItems', Views.Pages.Meeting.RankedAgendaItems);
    });
  }},

  column3: function() {
    this.builder.subview('votes', Views.Pages.Meeting.Votes);
    this.builder.subview('notes', Views.Pages.Meeting.Notes);
  },

  viewProperties: {
    fixedHeight: true,

    attach: function($super) {
      $super();

      $(window).resize(this.hitch('adjustNotesHeight'));

      Application.onCurrentUserChange(function(currentUser) {
        var params = this.params();
        if (params) {
          return currentUser
            .rankings()
            .where({meetingId: params.meetingId})
            .fetch()
            .success(this.hitch('populateContentAfterFetch', params));
        }
      }, this);
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
    },

    meeting: {
      change: function(meeting) {
        this.body.bindMarkdown(meeting, 'body');

        var team = meeting.team();
        Application.currentTeam(team);

        this.notes.notes(meeting.notes());

        this.registerInterest(meeting, 'onDestroy', this.bind(function() {
          if (this.is(':visible')) History.pushState(null, null, Application.currentTeam().url());
        }));

        this.defer(function() {
          this.adjustNotesHeight();
        });
        meeting.trackView();
      }
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
      this.rankedAgendaItemsHeader.show();
      this.agendaItemDetails.removeClass('active');
    },

    showAgendaItemDetails: function() {
      this.rankedAgendaItemsHeader.hide();
      this.agendaItemDetails.addClass('active');
    },

    navigateToNewAgendaItemForm: function() {
      History.replaceState(null, null, this.meeting().newAgendaItemUrl());
    },

    adjustNotesHeight: function() {
      this.notes.fillVerticalSpace(this.columns);
    },

    loading: {
      change: function(loading) {
        if (loading) {
          this.columns.hide();
          this.spinner.show();
        } else {
          this.columns.show();
          this.spinner.hide();
        }
      }
    }
  }
});
