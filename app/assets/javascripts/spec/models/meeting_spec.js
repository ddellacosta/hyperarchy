//= require spec/spec_helper

describe("Meeting", function() {
  var creator, meeting, agendaItem1, agendaItem2, agendaItem3, agendaItem4;
  beforeEach(function() {
    creator = User.createFromRemote({id: 1, firstName: "Meeting", lastName: "Creator"});
    meeting = creator.meetings().createFromRemote({id: 22, voteCount: 0, body: "What's your favorite color?"});
    agendaItem1 = meeting.agendaItems().createFromRemote({id: 1, body: "Red"});
    agendaItem2 = meeting.agendaItems().createFromRemote({id: 2, body: "Green"});
    agendaItem3 = meeting.agendaItems().createFromRemote({id: 3, body: "Blue"});
    agendaItem4 = meeting.agendaItems().createFromRemote({id: 4, body: "Yellow"});

    Meeting.SCORE_EXTRA_VOTES = 1;
    Meeting.SCORE_EXTRA_HOURS = 2;
    Meeting.SCORE_GRAVITY = 1.8;
  });


  describe("#updateScore", function() {
    it("decreases the score as time passes and increases it as votes are added", function() {
      freezeTime();
      meeting.remotelyUpdated({createdAt: new Date()});
      meeting.updateScore();

      var score1 = meeting.score();
      jump(3600000);

      meeting.updateScore();
      var score2 = meeting.score();
      expect(score2).toBeLessThan(score1);

      meeting.remotelyUpdated({voteCount: 5});
      meeting.updateScore();
      var score3 = meeting.score();
      expect(score3).toBeGreaterThan(score2);

      jump(3600000);
      meeting.updateScore();
      var score4 = meeting.score();
      expect(score4).toBeLessThan(score3);
    });
  });

  describe("#absoluteUrl", function() {
    it("appends the Application.origin to the url", function() {
      attachLayout();
      spyOn(Application, 'origin').andReturn('https://actionitems.us')
      expect(meeting.absoluteUrl()).toBe('https://actionitems.us/meetings/22');
    });
  });

  describe("#url", function() {
    it("returns the correct url", function() {
      expect(meeting.url()).toEqual('/meetings/22');
    });
  });
});
