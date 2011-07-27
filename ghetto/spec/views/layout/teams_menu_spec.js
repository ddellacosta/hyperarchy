//= require spec/spec_helper

describe("Views.Layout.TeamsMenu", function() {
  var teamsMenu;
  beforeEach(function() {
    teamsMenu = renderLayout().teamsMenu;
    expect(teamsMenu).toExist();
  });

  describe("showing and hiding the Add Team link and the dropdown link", function() {
    var singleMembershipUser, multiMembershipUser, org1, org2;

    beforeEach(function() {
      singleMembershipUser = User.createFromRemote({id: 1, guest: false, firstName: "Joe", lastName: "Member", emailHash: 'fake-email-hash'});
      multiMembershipUser = User.createFromRemote({id: 2, guest: false, firstName: "Joe", lastName: "Member", emailHash: 'fake-email-hash'});

      org1 = Team.createFromRemote({id: 1});
      org2 = Team.createFromRemote({id: 2});
      singleMembershipUser.memberships().createFromRemote({teamId: org1.id()});
      multiMembershipUser.memberships().createFromRemote({teamId: org1.id()});
      multiMembershipUser.memberships().createFromRemote({teamId: org2.id()});

      expect(singleMembershipUser.teams().size()).toEqual(1);
      
    });

    it("shows the Add Teams links when the user is a member of one team, and shows the dropdown menu link if they have more than one", function() {
      Application.currentUser(singleMembershipUser);

      expect(teamsMenu.addTeamLink).toBeVisible();
      expect(teamsMenu.dropdownMenu).toBeHidden();
      
      Application.currentUser(multiMembershipUser);

      expect(teamsMenu.addTeamLink).toBeHidden();
      expect(teamsMenu.dropdownMenu).toBeVisible();

      Application.currentUser(singleMembershipUser);

      expect(teamsMenu.addTeamLink).toBeVisible();
      expect(teamsMenu.dropdownMenu).toBeHidden();
    });

    it("shows the dropdown menu when the user first becomes a member of multiple organizaitons and hides it if they revert back to one", function() {
      expect(singleMembershipUser.teams().size()).toEqual(1);
      Application.currentUser(singleMembershipUser);

      expect(teamsMenu.addTeamLink).toBeVisible();
      expect(teamsMenu.dropdownMenu).toBeHidden();

      var membership2 = singleMembershipUser.memberships().createFromRemote({teamId: org2.id()});

      expect(teamsMenu.addTeamLink).toBeHidden();
      expect(teamsMenu.dropdownMenu).toBeVisible();

      membership2.remotelyDestroyed();

      expect(teamsMenu.addTeamLink).toBeVisible();
      expect(teamsMenu.dropdownMenu).toBeHidden();

      Application.currentUser(multiMembershipUser);
      expect(teamsMenu.userSubscriptions.size()).toEqual(2);
    });
  });

  describe("when the Add Team link is clicked", function() {
    describe("when the current user is a guest", function() {
      beforeEach(function() {
        Application.currentUser(User.createFromRemote({id: 1, guest: true}));
      });

      it("shows the signup form with the team name field visible and a relevant title", function() {
        teamsMenu.addTeamLink.click();
        expect(Application.signupForm).toBeVisible();
        expect(Application.signupForm.teamSection).toBeVisible();
        expect(Application.signupForm).toHaveClass('add-team');
        expect(Application.signupForm.teamName[0]).toBe(document.activeElement);
      });
    });

    describe("when the current user is a member", function() {
      beforeEach(function() {
        Application.currentUser(User.createFromRemote({id: 1, guest: false}));
      });

      it("shows the add team form", function() {
        teamsMenu.dropdownMenu.addTeamLink.click();

        expect(Application.addTeamForm).toBeVisible();
      });
    });
  });

  describe("when the add team link is clicked inside the dropdown", function() {
    beforeEach(function() {
      Application.currentUser(User.createFromRemote({id: 1, guest: false}));
    });

    it("shows the add team form", function() {
      teamsMenu.dropdownMenu.addTeamLink.click();

      expect(Application.addTeamForm).toBeVisible();
    });
  });

  describe("the teams list in the dropdown menu", function() {
    var u1m1, u2m1, u2m2, org1, org2, user1, user2;

    beforeEach(function() {
      org1 = Team.createFromRemote({id: 1, name: "org1"});
      user1 = User.createFromRemote({id: 1});
      user2 = User.createFromRemote({id: 2});
      org2 = Team.createFromRemote({id: 2, name: "org2"});
      u1m1 = user1.memberships().createFromRemote({id: 1, teamId: org1.id()});
      u2m1 = user2.memberships().createFromRemote({id: 2, teamId: org1.id(), role: "owner"});
      u2m2 = user2.memberships().createFromRemote({id: 3, teamId: org2.id()});
    });

    it("always contains the current user's teams", function() {
      Application.currentUser(user1);
      expect(teamsMenu.dropdownMenu).toContain(":contains('org1')");
      expect(teamsMenu.dropdownMenu).not.toContain(":contains('org2')");

      Application.currentUser(user2);
      expect(teamsMenu.dropdownMenu).toContain(":contains('org1')");
      expect(teamsMenu.dropdownMenu).toContain(":contains('org2')");

      u2m2.remotelyDestroyed();

      expect(teamsMenu.dropdownMenu).not.toContain(":contains('org2')");

      user2.memberships().createFromRemote({id: 4, teamId: 2});

      expect(teamsMenu.dropdownMenu).toContain(":contains('org2')");
    });

    it("navigates to an team's url when that team's name is clicked in the dropdown menu", function() {
      Application.currentUser(user1);
      var orgLink = teamsMenu.dropdownMenu.teamsList.find("li:contains('org1')");
      expect(orgLink).toExist();
      orgLink.click();
      expect(Path.routes.current).toBe(org1.url());
    });

    it("shows the admin link for only those teams that the current user owns", function() {
      Application.currentUser(user2);
      teamsMenu.dropdownMenu.link.click();
      var org1Li = teamsMenu.dropdownMenu.teamsList.find("li:contains('org1')").view();
      var org2Li = teamsMenu.dropdownMenu.teamsList.find("li:contains('org2')").view();

      expect(org1Li.adminLink).toBeVisible();
      expect(org2Li.adminLink).toBeHidden();

      u2m1.remotelyUpdated({role: "member"});
      u2m2.remotelyUpdated({role: "owner"});

      expect(org1Li.adminLink).toBeHidden();
      expect(org2Li.adminLink).toBeVisible();
    });

    describe("when an admin link is clicked", function() {
      it("navigates to the settings page for that team and closes the dropdown menu", function() {
        Application.currentUser(user2);
        teamsMenu.dropdownMenu.link.click();


        waits(); // wait for defered close click handler to bind to window

        runs(function() {
          var org1Li = teamsMenu.dropdownMenu.teamsList.find("li:contains('org1')").view();
          expect(org1Li.adminLink).toBeVisible();

          spyOn(Application, 'showPage');
          org1Li.adminLink.click()

          expect(teamsMenu.dropdownMenu.menu).toBeHidden();
          expect(Path.routes.current).toBe(org1.settingsUrl());
        });
      });
    });
  });

});
