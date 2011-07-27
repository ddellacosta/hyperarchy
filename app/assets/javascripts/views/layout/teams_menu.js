_.constructor('Views.Layout.TeamsMenu', View.Template, {
  content: function() { with(this.builder) {
    div({id: "teams-menu"}, function() {
      a({id: "add-team-link"}, "Add Your Team").ref('addTeamLink').click("showAddTeamForm");
      subview("dropdownMenu", Views.Layout.DropdownMenu, {
        linkContent: function() {
          this.builder.text("Teams");
        },

        menuContent: function() {
          var b = this.builder;
          this.builder.subview('teamsList', Views.Components.SortedList, {
            buildElement: function(team) {
              return Views.Layout.TeamsMenuItem.toView({team: team});
              return $("<li><a>" + team.name() +"</a></li>").click(function() {
                History.pushState(null, null, team.url());
              });
            }
          });
          this.builder.a({id: "add-team-menu-item"}, "Add Your Team").ref('addTeamLink').click("showAddTeamForm");
        }
      });
    });
  }},

  viewProperties: {
    initialize: function() {
      this.userSubscriptions = new Monarch.SubscriptionBundle();
      this.dropdownMenu.showAddTeamForm = this.hitch('showAddTeamForm');
    },

    attach: function() {
      Application.onCurrentUserChange(function(user) {
        this.showOrHideDropdownLink();
        this.userSubscriptions.destroy();
        this.userSubscriptions.add(user.teams().onInsert(this.hitch('showOrHideDropdownLink')));
        this.userSubscriptions.add(user.teams().onRemove(this.hitch('showOrHideDropdownLink')));
        this.dropdownMenu.teamsList.relation(user.teams());
      }, this);
    },

    showOrHideDropdownLink: function() {
      if (Application.currentUser().teams().size() > 1) {
        this.dropdownMenu.show();
        this.addTeamLink.hide();
      } else {
        this.dropdownMenu.hide();
        this.addTeamLink.show();
      }
    },

    showAddTeamForm: function() {
      if (Application.currentUser().guest()) {
        Application.signupForm.show();
        Application.signupForm.showTeamSection();
      } else {
        Application.addTeamForm.show();
      }
    }
  }
});

