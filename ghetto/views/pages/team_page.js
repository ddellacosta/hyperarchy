_.constructor('Views.Pages.Team', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "team"}, function() {

      div({id: "headline"}, function() {
        a({'class': "new button"}, "Ask A Meeting").ref('newMeetingButton').click('newMeeting');
        h1("Choose A Meeting:");
      });

      subview("meetingsList", Views.Components.SortedList, {
        buildElement: function(meeting) {
          return Views.Pages.Team.MeetingLi.toView({meeting: meeting});
        }
      });

      div({id: "list-bottom"}, function() {
        subview('spinner', Views.Components.Spinner);
      }).ref("listBottom");
    });
  }},

  viewProperties: {
    attach: function() {
      $(window).scroll(this.hitch('fetchIfNeeded'));
    },

    team: {
      change: function(team) {
        Application.currentTeamId(team.id());
        this.meetingsList.relation(null);
        this.loading(true);

        team.trackView();

        return team.fetchMoreMeetings()
          .success(this.bind(function() {
            this.stopLoadingIfNeeded();
            this.meetingsList.relation(team.meetings());
          }));
      }
    },

    params: {
      write: function(newParams, oldParams) {
        if (oldParams && newParams.teamId === oldParams.teamId) {
          Application.scrollTop(this.previousScrollPosition || 0);
        } else {
          Application.scrollTop(0);
        }
      },

      change: function(params) {
        var team = Team.find(params.teamId);
        if (!team) History.replaceState(null,  null, Application.currentUser().defaultTeam().url());
        this.team(team);
      }
    },

    beforeHide: function() {
      if (!this.is(":visible")) return;
      this.previousScrollPosition = Application.scrollTop();
    },

    newMeeting: function() {
      Application.newMeeting.show();
    },

    fetchIfNeeded: function() {
      if (!this.is(':visible')) return;
      if (!this.meetingsList.relation()) return;
      if (this.remainingScrollHeight() < this.listBottom.height() * 2) {
        this.team().fetchMoreMeetings().success(this.hitch('stopLoadingIfNeeded'));
      }
    },

    stopLoadingIfNeeded: function() {
      if (this.team().numMeetingsFetched >= this.team().meetingCount()) {
        this.loading(false);
      }
    },

    loading: {
      change: function(loading) {
        if (loading) {
          this.spinner.show();
          this.listBottom.show();
        } else {
          this.spinner.hide();
          this.listBottom.hide();
        }
      }
    },

    remainingScrollHeight: function() {
      var doc = $(document), win = $(window);
      return doc.height() - doc.scrollTop() - win.height();
    }
  }
});
