//= require spec/spec_helper

describe("Views.Pages.Meeting.NoteLi", function() {
  var currentUser, meeting, note, creator, noteLi, noteEditableByCurrentUser;


  beforeEach(function() {
    attachLayout();
    currentUser = User.createFromRemote({id: 1});
    Application.currentUser(currentUser);

    meeting = Meeting.createFromRemote({id: 22, creatorId: 1, createdAt: 234});
    creator = User.createFromRemote({id: 2, firstName: "Noteo", lastName: "Santiago"});
    note = meeting.notes().createFromRemote({id: 11, body: "I likeah the fruiloops so much", creatorId: creator.id(), createdAt: 3245});
    spyOn(note, 'editableByCurrentUser').andCallFake(function() {
      return noteEditableByCurrentUser;
    });

    noteLi = Views.Pages.Meeting.NoteLi.toView({note: note});
  });

  describe("#initialize", function() {
    it("populates the avatar, name, body, and createdAt date", function() {
      expect(noteLi.avatar.user()).toBe(creator);
      expect(noteLi.creatorName.text()).toBe(creator.fullName());
      expect(noteLi.body.html()).toBe($.markdown(note.body()));
      expect(noteLi.createdAt.text()).toBe(note.formattedCreatedAt());
    });
  });
  
  describe("note deletion", function() {
    describe("when the li is initialized", function() {
      it("adds the deletable class if the current user can delete the note", function() {
        noteEditableByCurrentUser = false;
        noteLi = Views.Pages.Meeting.NoteLi.toView({note: note});
        expect(noteLi).not.toHaveClass('destroyable');

        noteEditableByCurrentUser = true;
        noteLi = Views.Pages.Meeting.NoteLi.toView({note: note});
        expect(noteLi).toHaveClass('destroyable');
      });

      describe("when the destroy button is clicked", function() {
        it("destroys the note", function() {
          useFakeServer();
          noteLi.destroyButton.click();
          expect(Server.destroys.length).toBe(1);
          expect(Server.lastDestroy.record).toBe(note);
        });
      });
    });

    describe("when the current user changes", function() {
      it("adds the deletable class if the current user can delete the note", function() {
        noteEditableByCurrentUser = true;
        Application.currentUser(creator);
        expect(noteLi).toHaveClass('destroyable');

        noteEditableByCurrentUser = false;
        Application.currentUser(currentUser);
        expect(noteLi).not.toHaveClass('destroyable');
      });
    });
  });
});
