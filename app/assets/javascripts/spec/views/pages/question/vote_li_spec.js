//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Views.Pages.Question.VoteLi", function() {
  var voteLi, vote, user, question;
  beforeEach(function() {
    user = User.created({id: 1, firstName: 'joe', lastName: 'henderson'});
    question = Question.created({id: 1, creatorId: 1, createdAt: 234234});
    vote = user.votes().created({questionId: question.id(), updatedAt: 1308352736162});
    voteLi = Views.Pages.Question.VoteLi.toView({vote: vote});
  });

  describe("when the vote is assigned", function() {
    beforeEach(function() {
      useFakeServer();
      $('#jasmine_content').html(voteLi);
    });

    describe("#initialize", function() {
      describe("when the vote's user is in the local repository", function() {
        it("populates the li with their name", function() {
          expect(voteLi).toBeVisible();
          expect(voteLi.name.text()).toBe(user.fullName());
          expect(voteLi.date.text()).toBe(vote.formattedUpdatedAt());
          expect(voteLi.avatar.user()).toEqual(user);
        });
      });

      describe("when the vote's user is not in the local repository", function() {
        beforeEach(function() {
          $('#jasmine_content').empty();
        });

        it("fetches the user and populates the li with their name", function() {
          user.destroyed();
          voteLi = Views.Pages.Question.VoteLi.toView({vote: vote});
          $('#jasmine_content').html(voteLi);

          expect(voteLi).toBeHidden();
          expect(Server.fetches.length).toBe(1);
          Server.lastFetch().succeed({users: {1: user.wireRepresentation(true)}});

          expect(voteLi).toBeVisible();
          expect(voteLi.name.text()).toBe(user.fullName());
          expect(voteLi.date.text()).toBe(vote.formattedUpdatedAt());
          expect(voteLi.avatar.user()).toEqual(user);
        });
      });
    });

    describe("when the user changes their name", function() {
      it("updates the text of the li", function() {
        user.updated({firstName: "john"});
        expect(voteLi.name.text()).toBe(user.fullName());
      });
    });

    describe("when the vote's updatedAt field changes", function() {
      it("changes the time in the li", function() {
        vote.updated({updatedAt: vote.updatedAt().getTime() + 20000});
        expect(voteLi.date.text()).toBe(vote.formattedUpdatedAt());
      });
    });
  });

  describe("when clicked", function() {
    it("navigates to the url for the given vote", function() {
      attachLayout();
      spyOn(Application, 'showPage');
      Application.currentUser(user);
      voteLi.find('a').click();
      expect(Path.routes.current).toBe(vote.url());
    });
  });
});
