_.constructor('Views.Pages.Account.MembershipPreferencesLi', Monarch.View.Template, {
  content: function() { with (this.builder) {
    li(function() {
      h3(function() {
        span("Email Preferences for ");
        span().ref('organizationName');
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new questions: ");
        select({name: "notifyOfNewQuestions"}, function() {
          option({value: "immediately"}, "Immediately");
          option({value: "every5"}, "Every 5 Minutes");
          option({value: "hourly"}, "Hourly");
          option({value: "daily"}, "Daily");
          option({value: "weekly"}, "Weekly");
          option({value: "never"}, "Never");
        });
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new agendaItems to questions on which I voted: ");
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
        label("Email me about new comments on agendaItems I suggested: ");
        select({name: "notifyOfNewCommentsOnOwnAgendaItems"}, function() {
          option({value: "immediately"}, "Immediately");
          option({value: "every5"}, "Every 5 Minutes");
          option({value: "hourly"}, "Hourly");
          option({value: "daily"}, "Daily");
          option({value: "weekly"}, "Weekly");
          option({value: "never"}, "Never");
        });
      });

      div({'class': "email-preference"}, function() {
        label("Email me about new comments on agendaItems I have ranked: ");
        select({name: "notifyOfNewCommentsOnRankedAgendaItems"}, function() {
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
      this.organizationName.bindText(this.membership.organization(), 'name');
      this.model(this.membership);
      this.find('select').change(this.hitch('save'));
    }
  }
});
