_.constructor('Views.Pages.Account.MembershipPreferencesLi', Monarch.View.Template, {
  content: function() { with (this.builder) {
    li(function() {
      h3(function() {
        span("Email Preferences for ");
        span().ref('teamName');
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new meetings: ");
        select({name: "notifyOfNewMeetings"}, function() {
          option({value: "immediately"}, "Immediately");
          option({value: "every5"}, "Every 5 Minutes");
          option({value: "hourly"}, "Hourly");
          option({value: "daily"}, "Daily");
          option({value: "weekly"}, "Weekly");
          option({value: "never"}, "Never");
        });
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new agendaItems to meetings on which I voted: ");
        select({name: "notifyOfNewAgendaItems"}, function() {
          option({value: "immediately"}, "Immediately");
          option({value: "every5"}, "Every 5 Minutes");
          option({value: "hourly"}, "Hourly");
          option({value: "daily"}, "Daily");
          option({value: "weekly"}, "Weekly");
          option({value: "never"}, "Never");
        });
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new notes on agendaItems I suggested: ");
        select({name: "notifyOfNewNotesOnOwnAgendaItems"}, function() {
          option({value: "immediately"}, "Immediately");
          option({value: "every5"}, "Every 5 Minutes");
          option({value: "hourly"}, "Hourly");
          option({value: "daily"}, "Daily");
          option({value: "weekly"}, "Weekly");
          option({value: "never"}, "Never");
        });
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new notes on agendaItems I have ranked: ");
        select({name: "notifyOfNewNotesOnRankedAgendaItems"}, function() {
          option({value: "immediately"}, "Immediately");
          option({value: "every5"}, "Every 5 Minutes");
          option({value: "hourly"}, "Hourly");
          option({value: "daily"}, "Daily");
          option({value: "weekly"}, "Weekly");
          option({value: "never"}, "Never");
        });
      });
    });
  }},

  viewProperties: {
    initialize: function() {
      this.teamName.bindText(this.membership.team(), 'name');
      this.model(this.membership);
      this.find('select').change(this.hitch('save'));
    }
  }
});
