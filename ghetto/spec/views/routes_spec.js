//= require spec/spec_helper

describe("Routes", function() {
  var member, defaultGuest, defaultTeam;
  beforeEach(function() {
    renderLayout();
    defaultTeam = Team.createFromRemote({id: 23});
    defaultGuest = User.createFromRemote({id: 1, defaultGuest: true, guest: true});
    member = defaultTeam.makeMember({id: 2});
    spyOn(defaultGuest, 'defaultTeam').andReturn(defaultTeam);
    spyOn(member, 'defaultTeam').andReturn(defaultTeam);
    Application.currentUser(defaultGuest);
    Application.currentTeam(defaultTeam);
  });

  describe("/", function() {
    it("navigates to the current user's default team page", function() {
      spyOn(_, 'defer').andCallFake(function(fn) {
        fn();
      });
      History.pushState(null, null, '/');
      
      expect(Path.routes.current).toBe(defaultTeam.url());
      expect(_.defer).toHaveBeenCalled(); // firefox needs this
    });
  });

  describe("/teams/:id", function() {
    describe("when the team is present in the local repository", function() {
      it("shows only the teamPage and assigns the id on it", function() {
        Team.createFromRemote({id: 23});
        History.pushState(null, null, '/teams/23');

        expect(Application.meetingPage).toBeHidden();
        expect(Application.teamPage).toBeVisible();
        expect(Application.teamPage.params()).toEqual({teamId: 23});
      });
    });
  });

  describe("/meetings/:meetingId", function() {
    it("shows only the meetingsPage and assigns the meetingId param", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/meetings/12');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();

      expect(Application.meetingPage.params()).toEqual({
        meetingId: 12
      });
    });
  });

  describe("/meetings/:meetingId/full_screen", function() {
    it("shows only the meetingsPage and assigns fullScreen = true, ", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/meetings/12/full_screen');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();

      expect(Application.meetingPage.params()).toEqual({
        meetingId: 12,
        fullScreen: true
      });
    });
  });

  describe("/meetings/:meetingId/votes/:voterId", function() {
    it("shows only the meetingsPage, assigns the id on it, and assigns the specified user's rankings relation on the ranked agendaItems list", function() {
      Application.meetingPage.show();
      History.pushState(null, null, '/meetings/12/votes/29');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();
      expect(Application.meetingPage.params()).toEqual({
        meetingId: 12,
        voterId: 29
      });
    });
  });

  describe("/meetings/:meetingId/agenda_items/new", function() {
    it("shows only the meetingsPage assigns the meeting id, and shows the new agendaItem form", function() {
      Application.meetingPage.show();
      History.pushState(null, null, '/meetings/12/agenda_items/new');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();
      expect(Application.meetingPage.params()).toEqual({
        meetingId: 12,
        agendaItemId: 'new'
      });
    });
  });

  describe("/meetings/:meetingId/agenda_items/:agendaItemId", function() {
    it("shows only the meetingsPage and assigns the id and selectedAgendaItemId on it", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/meetings/12/agenda_items/33');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();
      expect(Application.meetingPage.params()).toEqual({
        meetingId: 12,
        agendaItemId: 33
      });
    });
  });

  describe("/meetings/:meetingId/agenda_items/:agendaItemId/full_screen", function() {
    it("shows only the meetingsPage and assigns meetingId, agendaItemId, and fullScreen = true", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/meetings/12/agenda_items/33/full_screen');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();
      expect(Application.meetingPage.params()).toEqual({
        meetingId: 12,
        agendaItemId: 33,
        fullScreen: true
      });
    });
  });

  describe("/teams/:meetingId/meetings/new", function() {
    it("shows the meetingsPage in new mode", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/teams/1/meetings/new');
      expect(Application.teamPage).toBeHidden();
      expect(Application.meetingPage).toBeVisible();
      expect(Application.meetingPage.params()).toEqual({
        teamId: 1,
        meetingId: 'new'
      });
    });
  });

  describe("/account", function() {
    describe("if the current user is not a guest", function() {
      beforeEach(function() {
        Application.currentUser(member);
      });

      it("shows only the accountPage and assigns its user", function() {
        Application.teamPage.show();
        History.pushState(null, null, '/account');
        expect(Application.teamPage).toBeHidden();
        expect(Application.accountPage).toBeVisible();
        expect(Application.accountPage.params()).toEqual({userId: member.id()});
      });
    });

    describe("if the current user is a guest", function() {
      describe("if they log in / sign up at the prompt", function() {
        it("shows the account page and assigns its params", function() {
          Application.teamPage.show();
          History.pushState(null, null, '/account');
          expect(Application.teamPage).toBeVisible();

          expect(Application.loginForm).toBeVisible();
          Application.loginForm.emailAddress.val("dude@example.com");
          Application.loginForm.password.val("wicked");
          Application.loginForm.form.submit();
          expect($.ajax).toHaveBeenCalled();
          simulateAjaxSuccess({ current_user_id: member.id() });

          expect(Application.teamPage).toBeHidden();
          expect(Application.accountPage).toBeVisible();
          expect(Application.accountPage.params()).toEqual({userId: member.id()});
        });
      });

      describe("if they cancel at the prompt", function() {
        it("navigates them to their default team", function() {
          Application.teamPage.show();
          History.pushState(null, null, '/account');
          expect(Application.teamPage).toBeVisible();

          expect(Application.loginForm).toBeVisible();
          spyOn(Application, 'showPage');
          Application.loginForm.close();

          expect(Path.routes.current).toBe(defaultGuest.defaultTeam().url());
        });
      });
    });
  });
});
