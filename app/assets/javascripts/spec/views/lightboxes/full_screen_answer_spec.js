//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Views.Lightboxes.FullScreenAnswer", function() {
  var fullScreenAnswer, organization, creator, question, answer1, answer2, answer3;

  beforeEach(function() {
    renderLayout();
    fullScreenAnswer = Application.fullScreenAnswer.show();

    organization = Organization.created({id: 42});
    creator = organization.makeMember({id: 999, emailHash: 'blas', firstName: "Mr.", lastName: "Creator"});
    Application.currentUser(creator);
    question = organization.questions().created({id: 1, creatorId: 999, createdAt: 12});
    answer1 = creator.answers().created({id: 1, position: 1, questionId: 1, body: "meetingmapper.us", createdAt: 123});
    answer2 = creator.answers().created({id: 2, position: 2, questionId: 1, body: "actionitems.us", createdAt: 124});
    answer3 = creator.answers().created({id: 3, position: 3, questionId: 1, body: "agileplanner.co", createdAt: 125});

    fullScreenAnswer.answer(answer2);
  });

  describe("when the 'back to list' link is clicked", function() {
    it("navigates to the full screen consensus view", function() {
      spyOn(Application, 'showPage');
      fullScreenAnswer.backLink.click();
      expect(Path.routes.current).toBe(question.fullScreenUrl());
    });
  });

  describe("when the 'next' and 'previous' answer buttons are clicked", function() {
    it("navigates to the next/previous answer in full screen mode, hiding the links if reaching either end of the list", function() {
      useFakeServer(true);
      fullScreenAnswer.prevLink.click();

      expect(Path.routes.current).toBe(answer1.fullScreenUrl());
      expect(fullScreenAnswer.prevLink).toBeHidden();
      expect(fullScreenAnswer.nextLink).toBeVisible();
      expect(fullScreenAnswer.counter.text()).toBe('1 of 3');

      fullScreenAnswer.nextLink.click();

      expect(Path.routes.current).toBe(answer2.fullScreenUrl());
      expect(fullScreenAnswer.prevLink).toBeVisible();
      expect(fullScreenAnswer.nextLink).toBeVisible();
      expect(fullScreenAnswer.counter.text()).toBe('2 of 3');

      fullScreenAnswer.nextLink.click();

      expect(Path.routes.current).toBe(answer3.fullScreenUrl());
      expect(fullScreenAnswer.prevLink).toBeVisible();
      expect(fullScreenAnswer.nextLink).toBeHidden();
      expect(fullScreenAnswer.counter.text()).toBe('3 of 3');
    });
  });
});

