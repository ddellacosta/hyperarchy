//= require spec/spec_helper

describe("Views.Pages.Team", function() {

  var teamPage;
  beforeEach(function() {
    attachLayout();
    teamPage = Application.teamPage;
  });

  describe("when the params are assigned", function() {
    var team;
    beforeEach(function() {
      Team.createFromRemote({id: 1, social: true, name: "Actionitems Social"});
      team = Team.createFromRemote({id: 100, name: "Watergate"});
    });

    describe("when the team exists in the local repository", function() {
      it("assigns the team", function() {
        teamPage.params({teamId: team.id()});
        expect(teamPage.team()).toBe(team);
      });
    });

    describe("when the team does not exist in the local repository", function() {
      it("navigates to the team page for Actionitems Social", function() {
        spyOn(Application, 'showPage');
        teamPage.params({teamId: -1});
        expect(Path.routes.current).toBe(Application.currentUser().defaultTeam().url());
      });
    });

    describe("when the page was previously scrolled down", function() {
      var team1, team2, previousScrollTop;

      beforeEach(function() {
        $("#jasmine_content").html(teamPage);
        teamPage.show();
        team1 = Team.createFromRemote({id: 101, name: "Big Spenders"});
        team2 = Team.createFromRemote({id: 102, name: "Number Theorists"});
        teamPage.params({teamId: team1.id()});
        previousScrollTop = 400;
        spyOn(Application, 'scrollTop').andReturn(previousScrollTop)
        teamPage.hide();
        expect(Application.scrollTop).toHaveBeenCalled();
        Application.scrollTop.reset();
      });

      describe("when the user to returns to the SAME team's page", function() {
        it("restores the previous scroll position", function() {
          teamPage.show();
          teamPage.params({teamId: team1.id()});
          expect(Application.scrollTop).toHaveBeenCalledWith(previousScrollTop);
        });
      });

      describe("when the user views a DIFFERENT team's page", function() {
        it("returns to the top of the page", function() {
          teamPage.show();
          teamPage.params({teamId: team2.id()});
          expect(Application.scrollTop).toHaveBeenCalledWith(0);
        });
      });
    });

    it("assigns the currentTeamId on the layout", function() {
      teamPage.params({teamId: team.id()});
      expect(Application.currentTeamId()).toBe(team.id());
    });
  });

  describe("when the team is assigned", function() {
    it("fetches the and renders the team's questions, and fetches more when the view scrolls", function() {
      var user, team1, question1, question2, remainingScrollHeight;

      $('#jasmine_content').html(Application);
      Application.teamPage.show();

      enableAjax();
      user = login();
      usingBackdoor(function() {
        team1 = Team.create();
        team2 = Team.create();
        user.memberships().create({teamId: team1.id()});
        user.memberships().create({teamId: team2.id()});
        createMultiple({
          count: 33,
          tableName: 'questions',
          fieldValues: { teamId: team1.id() }
        });
        team2.questions().create();
        Team.fetch(); // fetch counts
        Question.clear();
      });

      waitsFor("questions to be fetched", function(complete) {
        teamPage.team(team1).success(complete);
        expect(team1.questions().size()).toBe(0);
      });

      runs(function() {
        expect(team1.questions().size()).toBe(16);
        var questionsList = teamPage.questionsList;
        team1.questions().each(function(question) {
          expect(questionsList).toContain("li:contains('" + question.body() + "')");
        });

        var question = team1.questions().first();

        spyOn(Application, 'showPage');

        questionsList.find("li:contains('" + question.body() + "') > div").click();
        expect(Path.routes.current).toBe("/questions/" + question.id());

        spyOn(teamPage, 'remainingScrollHeight').andReturn(100);
        $(window).scroll();
      });

      waitsFor("more questions to be fetched after scrolling", function() {
        return team1.questions().size() === 32;
      });

      runs(function() {
        $(window).scroll();
      });

      waitsFor("more questions to be fetched after scrolling again", function() {
        return team1.questions().size() === 33;
      });

      runs(function() {
        expect(teamPage.listBottom).toBeHidden();
      });

      // switch to org 2

      waitsFor("team 2 questions to be fetched", function(complete) {
        teamPage.team(team2).success(complete);
        expect(teamPage.questionsList.find('li')).not.toExist();
        expect(teamPage.loading()).toBeTruthy();
      })

      runs(function() {
        expect(teamPage.questionsList.find('li').length).toBe(1);
        expect(teamPage.loading()).toBeFalsy();
      });
    });
  });

  describe("when the new question button is clicked", function() {
    it("navigates to the new question form for the current team", function() {
      $("#jasmine_content").html(Application);
      var team = Team.createFromRemote({id: 34});
      teamPage.team(team);
      teamPage.newQuestionButton.click();
      expect(Application.newQuestion).toBeVisible();
    });
  });

  describe("mixpanel tracking", function() {
    var team;

    beforeEach(function() {
      team = Team.createFromRemote({id: 1, name: "Whales"});
    });

    describe("when the team changes", function() {
      it("pushes a 'view team' event to the mixpanel queue", function() {
        teamPage.team(team);
        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toBe('View Team');
      });
    });
  });
});
