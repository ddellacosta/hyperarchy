_.constructor('Views.Pages.TeamSettings', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: 'team-settings'}, function() {
      h2("Team Settings")
      form(function() {
        label({'for': "name"}, "Name");
        input({'name': "name"}).ref('name');
        label({'for': "privacy"}, "Privacy: ");
        select({'name': "privacy"}, function() {
          option({'value': 'public'}, "Public");
          option({'value': 'private'}, "Private");
        }).ref('privacy');
        input({type: "submit", value: "Save", 'class': "update button"}).ref('updateButton');
      }).submit('save');

      div({id: "members"}, function() {
        a({'class': "link"}, "Invite Your Team").ref('inviteLink').click('showInviteBox');
        h2("Members");
        table(function() {
          thead(function() {
            th("Name");
            th("Email Address");
            th("Role");
            th("");
          });
          subview('memberships', Views.Components.SortedList, {
            placeholderTag: "tbody",
            rootTag: "tbody",
            buildElement: function(membership) {
              return Views.Pages.TeamSettings.MembershipLi.toView({membership: membership});
            }
          });
        });
      });
    });
  }},

  viewProperties: {
    initialize: function() {
      this.find('input,select').bind('keyup paste cut change', this.hitch('enableOrDisableUpdateButton'));
    },

    params: {
      change: function(params) {
        return this.team(Team.find(params.teamId));
      }
    },

    team: {
      change: function(team) {
        Application.currentTeam(team);
        this.model(team);
        this.enableOrDisableUpdateButton();
        return team.memberships().joinTo(User).fetch().success(function() {
          this.memberships.relation(team.memberships().joinTo(User).where({guest: false}).project(Membership));
        }, this);
      }
    },

    enableOrDisableUpdateButton: function() {
      if (this.fieldValuesMatchModel()) {
        this.updateButton.attr('disabled', true);
      } else {
        this.updateButton.attr('disabled', false);
      }
    },

    save: function($super) {
      $super().success(this.hitch('enableOrDisableUpdateButton'));
      return false;
    },

    showInviteBox: function() {
      Application.inviteBox.show();
    }
  }
});
