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

        expect(Application.questionPage).toBeHidden();
        expect(Application.teamPage).toBeVisible();
        expect(Application.teamPage.params()).toEqual({teamId: 23});
      });
    });
  });

  describe("/questions/:questionId", function() {
    it("shows only the questionsPage and assigns the questionId param", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/questions/12');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();

      expect(Application.questionPage.params()).toEqual({
        questionId: 12
      });
    });
  });

  describe("/questions/:questionId/full_screen", function() {
    it("shows only the questionsPage and assigns fullScreen = true, ", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/questions/12/full_screen');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();

      expect(Application.questionPage.params()).toEqual({
        questionId: 12,
        fullScreen: true
      });
    });
  });

  describe("/questions/:questionId/votes/:voterId", function() {
    it("shows only the questionsPage, assigns the id on it, and assigns the specified user's rankings relation on the ranked agendaItems list", function() {
      Application.questionPage.show();
      History.pushState(null, null, '/questions/12/votes/29');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();
      expect(Application.questionPage.params()).toEqual({
        questionId: 12,
        voterId: 29
      });
    });
  });

  describe("/questions/:questionId/agenda_items/new", function() {
    it("shows only the questionsPage assigns the question id, and shows the new agendaItem form", function() {
      Application.questionPage.show();
      History.pushState(null, null, '/questions/12/agenda_items/new');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();
      expect(Application.questionPage.params()).toEqual({
        questionId: 12,
        agendaItemId: 'new'
      });
    });
  });

  describe("/questions/:questionId/agenda_items/:agendaItemId", function() {
    it("shows only the questionsPage and assigns the id and selectedAgendaItemId on it", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/questions/12/agenda_items/33');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();
      expect(Application.questionPage.params()).toEqual({
        questionId: 12,
        agendaItemId: 33
      });
    });
  });

  describe("/questions/:questionId/agenda_items/:agendaItemId/full_screen", function() {
    it("shows only the questionsPage and assigns questionId, agendaItemId, and fullScreen = true", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/questions/12/agenda_items/33/full_screen');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();
      expect(Application.questionPage.params()).toEqual({
        questionId: 12,
        agendaItemId: 33,
        fullScreen: true
      });
    });
  });

  describe("/teams/:questionId/questions/new", function() {
    it("shows the questionsPage in new mode", function() {
      Application.teamPage.show();
      History.pushState(null, null, '/teams/1/questions/new');
      expect(Application.teamPage).toBeHidden();
      expect(Application.questionPage).toBeVisible();
      expect(Application.questionPage.params()).toEqual({
        teamId: 1,
        questionId: 'new'
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
