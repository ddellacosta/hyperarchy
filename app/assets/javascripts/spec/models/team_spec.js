//= require spec/spec_helper

describe("Team", function() {
  var team;

  beforeEach(function() {
    team = Team.createFromRemote({id: 22, questionCount: 32});
  });

  describe(".findSocial", function() {
    it("returns the social team", function() {
      var nonSocial = Team.createFromRemote({id: 1, social: false});
      var social = Team.createFromRemote({id: 2, social: true});
      expect(Team.findSocial()).toBe(social);
    });
  });

  describe("#fetchMoreQuestions", function() {
    it("fetches questions in blocks, first of 16, then of 24 with 8 questions of overlap with the previously fetched block", function() {
      expect(team.numQuestionsFetched).toBe(0);

      team.fetchMoreQuestions();
      expect($.ajax).toHaveBeenCalledWith({
        url: "/questions",
        data: {
          team_id: team.id(),
          offset: 0,
          limit: 16
        },
        dataType: 'records'
      });

      $.ajax.reset();
      team.fetchMoreQuestions();
      expect($.ajax).not.toHaveBeenCalled();

      simulateAjaxSuccess();
      expect(team.numQuestionsFetched).toBe(16);

      team.fetchMoreQuestions();

      expect($.ajax).toHaveBeenCalledWith({
        url: "/questions",
        data: {
          team_id: team.id(),
          offset: 8,
          limit: 24
        },
        dataType: 'records'
      });

      simulateAjaxSuccess();

      expect(team.numQuestionsFetched).toBe(32);

      $.ajax.reset();

      team.fetchMoreQuestions(); // num fetched == question count
      expect($.ajax).not.toHaveBeenCalled();
    });
  });


  describe("#url", function() {
    it("returns the correct url", function() {
      expect(team.url()).toEqual('/teams/22');
    });
  });
});