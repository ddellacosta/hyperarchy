//= require spec/spec_helper

describe("Views.Pages.Meeting.AgendaItemLi", function() {
  var meeting, agendaItem, agendaItemLi;

  beforeEach(function() {
    attachLayout();
    Application.currentUser(User.createFromRemote({id: 1}));

    meeting = Meeting.createFromRemote({id: 22, creatorId: 1, createdAt: 234});
    agendaItem = meeting.agendaItems().createFromRemote({id: 11, body: "Fruitloops"});
    agendaItemLi = Views.Pages.Meeting.AgendaItemLi.toView({agendaItem: agendaItem});
  });

  describe("when clicked", function() {
    it("navigates to the agendaItem's url", function() {
      spyOn(Application, 'showPage');
      agendaItemLi.click();
      expect(Path.routes.current).toBe(agendaItem.url());
    });
    
    describe("when in fullscreen mode", function() {
      it("navigates to the agendaItem's full screen url", function() {
        spyOn(Application, 'showPage');
        agendaItemLi = Views.Pages.Meeting.AgendaItemLi.toView({agendaItem: agendaItem, fullScreen: true});
        agendaItemLi.click();
        expect(Path.routes.current).toBe(agendaItem.fullScreenUrl());
      });
    });
  });

  describe("#handleDragStart (having trouble simulating it getting called without triggering the click handler)", function() {
    it("navigates to the meeting's bare url to cause the user's rankings to be revealed", function() {
      spyOn(Application, 'showPage');
      agendaItemLi.handleDragStart();
      expect(Path.routes.current).toBe(meeting.url());
    });
  });
});
