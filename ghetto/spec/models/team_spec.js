//= require spec/spec_helper

describe("Team", function() {
  var team;

  beforeEach(function() {
    team = Team.createFromRemote({id: 22, meetingCount: 32});
  });

  describe("#fetchMoreMeetings", function() {
    it("fetches meetings in blocks, first of 16, then of 24 with 8 meetings of overlap with the previously fetched block", function() {
      expect(team.numMeetingsFetched).toBe(0);

      team.fetchMoreMeetings();
      expect($.ajax).toHaveBeenCalledWith({
        url: "/meetings",
        data: {
          team_id: team.id(),
          offset: 0,
          limit: 16
        },
        dataType: 'records'
      });

      $.ajax.reset();
      team.fetchMoreMeetings();
      expect($.ajax).not.toHaveBeenCalled();

      simulateAjaxSuccess();
      expect(team.numMeetingsFetched).toBe(16);

      team.fetchMoreMeetings();

      expect($.ajax).toHaveBeenCalledWith({
        url: "/meetings",
        data: {
          team_id: team.id(),
          offset: 8,
          limit: 24
        },
        dataType: 'records'
      });

      simulateAjaxSuccess();

      expect(team.numMeetingsFetched).toBe(32);

      $.ajax.reset();

      team.fetchMoreMeetings(); // num fetched == meeting count
      expect($.ajax).not.toHaveBeenCalled();
    });
  });


  describe("#url", function() {
    it("returns the correct url", function() {
      expect(team.url()).toEqual('/teams/22');
    });
  });
});