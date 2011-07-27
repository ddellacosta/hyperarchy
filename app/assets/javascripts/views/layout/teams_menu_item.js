_.constructor('Views.Layout.TeamsMenuItem', Monarch.View.Template, {
  content: function() { with(this.builder) {
    li(function() {
      a({'class': "admin link"}, "Admin").ref('adminLink').click(function() {
        History.pushState(null, null, this.team.settingsUrl());
        $(window).click();
        return false;
      });
      a().ref('name');
    }).click(function() {
      History.pushState(null, null, this.team.url());
    });
  }},

  viewProperties: {
    initialize: function() {
      this.name.bindText(this.team, 'name');
      this.showOrHideAdminLink();
      var membership = this.team.membershipForCurrentUser();
      if (membership) this.registerInterest(membership, 'onUpdate', this.hitch('showOrHideAdminLink'));
    },

    showOrHideAdminLink: function() {
      if (this.team.currentUserCanEdit()) {
        this.adminLink.show();
      } else {
        this.adminLink.hide();
      }
    }
  }
});
