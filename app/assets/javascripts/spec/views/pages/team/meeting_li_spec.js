//= require spec/spec_helper

describe("Views.Pages.Team.MeetingLi", function() {
  var meetingLi, creator, meeting, agendaItem1, agendaItem2, agendaItem1Li, agendaItem2Li;
  beforeEach(function() {
    attachLayout();
    creator = User.createFromRemote({id: 1, emailHash: "email-hash"});
    meeting = Meeting.createFromRemote({id: 1, body: "What's your *favorite* color?", creatorId: creator.id()});
    agendaItem1 = meeting.agendaItems().createFromRemote({id: 1, body: "*Red*", position: 1});
    agendaItem2 = meeting.agendaItems().createFromRemote({id: 2, body: "Blue", position: 2});
    meetingLi = Views.Pages.Team.MeetingLi.toView({meeting: meeting});
    agendaItem1Li = meetingLi.find('li:contains("Red")').view();
    agendaItem2Li = meetingLi.find('li:contains("Blue")').view();
  });

  describe("#initialize", function() {
    it("assigns the body, agendaItems, agendaItem positions, and creator avatar", function() {
      expect(meetingLi.avatar.user()).toBe(creator);
      expect(meetingLi.body.html()).toBe($.markdown(meeting.body()));
      expect(meetingLi.agendaItems.relation().tuples()).toEqual(meeting.agendaItems().tuples());
      expect(agendaItem1Li.position.text()).toBe('1');
      expect(agendaItem1Li.body.html()).toBe($.markdown(agendaItem1.body()));
      expect(agendaItem2Li.position.text()).toBe('2');
      expect(agendaItem2Li.body.html()).toBe($.markdown(agendaItem2.body()));
    });
  });

  describe("when the position of agendaItems change", function() {
    it("updates the position number on the agendaItem li", function() {
      expect(agendaItem1Li.position.text()).toBe('1');
      expect(agendaItem2Li.position.text()).toBe('2');

      agendaItem1.remotelyUpdated({position: 2});
      agendaItem2.remotelyUpdated({position: 1});

      expect(agendaItem2Li.position.text()).toBe('1');
      expect(agendaItem1Li.position.text()).toBe('2');
    });
  });

  describe("when the bodies of agendaItems change", function() {
    it("updates the body on the agendaItem li", function() {
      agendaItem1.remotelyUpdated({body: "**Black**"});
      expect(agendaItem1Li.body.html()).toBe($.markdown(agendaItem1.body()));
    });
  });
});
