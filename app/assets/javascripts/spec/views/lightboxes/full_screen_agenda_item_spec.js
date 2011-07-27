//= require spec/spec_helper

describe("Views.Lightboxes.FullScreenAgendaItem", function() {
  var fullScreenAgendaItem, organization, creator, question, agendaItem1, agendaItem2, agendaItem3;

  beforeEach(function() {
    renderLayout();
    fullScreenAgendaItem = Application.fullScreenAgendaItem.show();

    organization = Organization.createFromRemote({id: 42});
    creator = organization.makeMember({id: 999, emailHash: 'blas', firstName: "Mr.", lastName: "Creator"});
    Application.currentUser(creator);
    question = organization.questions().createFromRemote({id: 1, creatorId: 999, createdAt: 12});
    agendaItem1 = creator.agendaItems().createFromRemote({id: 1, position: 1, questionId: 1, body: "meetingmapper.us", createdAt: 123});
    agendaItem2 = creator.agendaItems().createFromRemote({id: 2, position: 2, questionId: 1, body: "actionitems.us", createdAt: 124});
    agendaItem3 = creator.agendaItems().createFromRemote({id: 3, position: 3, questionId: 1, body: "agileplanner.co", createdAt: 125});

    fullScreenAgendaItem.agendaItem(agendaItem2);
  });

  describe("when the 'back to list' link is clicked", function() {
    it("navigates to the full screen consensus view", function() {
      spyOn(Application, 'showPage');
      fullScreenAgendaItem.backLink.click();
      expect(Path.routes.current).toBe(question.fullScreenUrl());
    });
  });

  describe("when the 'next' and 'previous' agendaItem buttons are clicked", function() {
    it("navigates to the next/previous agendaItem in full screen mode, hiding the links if reaching either end of the list", function() {
      useFakeServer(true);
      fullScreenAgendaItem.prevLink.click();

      expect(Path.routes.current).toBe(agendaItem1.fullScreenUrl());
      expect(fullScreenAgendaItem.prevLink).toBeHidden();
      expect(fullScreenAgendaItem.nextLink).toBeVisible();
      expect(fullScreenAgendaItem.counter.text()).toBe('1 of 3');

      fullScreenAgendaItem.nextLink.click();

      expect(Path.routes.current).toBe(agendaItem2.fullScreenUrl());
      expect(fullScreenAgendaItem.prevLink).toBeVisible();
      expect(fullScreenAgendaItem.nextLink).toBeVisible();
      expect(fullScreenAgendaItem.counter.text()).toBe('2 of 3');

      fullScreenAgendaItem.nextLink.click();

      expect(Path.routes.current).toBe(agendaItem3.fullScreenUrl());
      expect(fullScreenAgendaItem.prevLink).toBeVisible();
      expect(fullScreenAgendaItem.nextLink).toBeHidden();
      expect(fullScreenAgendaItem.counter.text()).toBe('3 of 3');
    });
  });
});

