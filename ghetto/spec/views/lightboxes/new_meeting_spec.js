//= require spec/spec_helper

describe("Views.Lightboxes.NewMeeting", function() {
  var newMeetingForm, team, member, guest;
  beforeEach(function() {
    renderLayout();
    team = Team.createFromRemote({id: 1, privacy: "public"});
    member = team.makeMember({id: 1});
    guest =  team.makeMember({id: 2, guest: true});
    Application.currentUser(member);
    Application.currentTeam(team);
    useFakeServer();

    newMeetingForm = Application.newMeeting.show();
    newMeetingForm.shareOnFacebook.attr('checked', false);
  });

  describe("when the form is submitted", function() {
    beforeEach(function() {
      spyOn(Application, 'showPage');
    });

    describe("when the 'share on facebook' box is checked", function() {
      beforeEach(function() {
        spyOn(FB, 'login');
        newMeetingForm.shareOnFacebook.attr('checked', true);
        useFakeServer();
      });

      describe("when the user successfully logs into facebook", function() {
        it("creates the meeting and posts it to the user's facebook feed", function() {
          newMeetingForm.body.val("Should I use facebook or diaspora?");
          newMeetingForm.submit.click();

          expect(FB.login).toHaveBeenCalled();
          expect(FB.login.mostRecentCall.args[1].perms).toContain("email");
          var callback = FB.login.mostRecentCall.args[0];
          callback({session: {}});

          expect(Server.creates.length).toBe(1);
          var meeting = Server.lastCreate.record;
          spyOn(meeting, 'shareOnFacebook');

          Server.lastCreate.simulateSuccess({creatorId: Application.currentUserId()});
          expect(meeting.shareOnFacebook).toHaveBeenCalled();
        });
      });

      describe("when the user does not successfully log into facebook", function() {
        describe("if the user is a guest", function() {
          beforeEach(function() {
            Application.currentUser(guest);
          });

          it("does not create the meeting and prompts them for normal signup", function() {
            newMeetingForm.body.val("Should I use facebook or diaspora?");
            newMeetingForm.submit.click();

            expect(FB.login).toHaveBeenCalled();
            var callback = FB.login.mostRecentCall.args[0];
            callback({session: null});

            expect(Application.signupForm).toBeVisible();
            expect(Server.creates).toBeEmpty();

            // simulate successful signin
            Application.currentUser(member);
            Application.signupForm.trigger('success');

            expect(Server.creates.length).toBe(1);
            var record = Server.lastCreate.record;
            expect(record.body()).toBe("Should I use facebook or diaspora?");

            Server.lastCreate.simulateSuccess({creatorId: Application.currentUserId()});
            expect(Path.routes.current).toBe(record.url());
          });
        });

        describe("if the user is a member", function() {
          it("creates the meeting and does not post it to facebook", function() {
            newMeetingForm.body.val("Should I use facebook or diaspora?");
            newMeetingForm.submit.click();

            expect(FB.login).toHaveBeenCalled();
            var callback = FB.login.mostRecentCall.args[0];
            callback({session: null});

            expect(Server.creates.length).toBe(1);
            var record = Server.lastCreate.record;
            expect(record.body()).toBe("Should I use facebook or diaspora?");
            spyOn(record, 'shareOnFacebook')

            Server.lastCreate.simulateSuccess({creatorId: Application.currentUserId()});
            expect(record.shareOnFacebook).not.toHaveBeenCalled();
            expect(Path.routes.current).toBe(record.url());
          });
        });
      });
    });

    describe("when the 'share on facebook' box is NOT checked", function() {
      describe("when the current user is a member", function() {
        describe("when the body field is not blank", function() {
          it("creates a meeting, hides the form, and navigates to its url", function() {

            newMeetingForm.body.val("What are you doing saturday night?");
            newMeetingForm.details.val("I am very lonely.");
            newMeetingForm.form.submit();

            expect(Server.creates.length).toBe(1);

            var createdMeeting = Server.lastCreate.record;
            expect(createdMeeting.team()).toBe(team);
            expect(createdMeeting.body()).toBe("What are you doing saturday night?");
            expect(createdMeeting.details()).toBe("I am very lonely.");

            Server.lastCreate.simulateSuccess({creatorId: Application.currentUserId()});

            expect(newMeetingForm).toBeHidden();
            expect(Path.routes.current).toBe(createdMeeting.url());
          });
        });

        describe("when the body field is blank", function() {
          it("does not create an meeting or hide the form", function() {
            newMeetingForm.body.val("    ");
            newMeetingForm.form.submit();
            expect(Server.creates.length).toBe(0);
            expect(newMeetingForm).toBeVisible();
          });
        });

        describe("when the body field exceeds 140 characters", function() {

          it("does not create the meeting or hide the form", function() {
            var longBody = ""
            _.times(141, function() {
              longBody += "X"
            });
            newMeetingForm.body.val(longBody);
            newMeetingForm.form.submit();
            expect(Server.creates.length).toBe(0);
            expect(newMeetingForm).toBeVisible();
          });
        });

      });

      describe("when the current user is a guest", function() {
        beforeEach(function() {
          Application.currentUser(guest);
        });

        describe("when the user logs in / signs up at the prompt", function() {
          it("creates the meeting and navigates to it", function() {
            newMeetingForm.body.val("What is your favorite vegatable?");
            newMeetingForm.form.submit();
            expect(Server.creates.length).toBe(0);
            expect(Application.signupForm).toBeVisible();
            Application.signupForm.firstName.val("Dude");
            Application.signupForm.lastName.val("Richardson");
            Application.signupForm.emailAddress.val("dude@example.com");
            Application.signupForm.password.val("wicked");
            Application.signupForm.form.submit();
            expect($.ajax).toHaveBeenCalled();

            $.ajax.mostRecentCall.args[0].success({ current_user_id: member.id() });

            expect(Server.creates.length).toBe(1);
            var createdRecord = Server.lastCreate.record
            expect(createdRecord.body()).toBe("What is your favorite vegatable?");

            Server.lastCreate.simulateSuccess({creatorId: Application.currentUserId()});
            expect(Path.routes.current).toBe(createdRecord.url());
          });
        });

        describe("when the user dismisses the prompt", function() {
          it("does not create a meeting but leaves the lightbox visible", function() {
            newMeetingForm.body.val("What is your favorite vegatable?");
            newMeetingForm.details.val("mine's chard.");
            newMeetingForm.form.submit();
            expect(Server.creates.length).toBe(0);
            expect(Application.signupForm).toBeVisible();
            Application.signupForm.close();
            expect(Server.creates.length).toBe(0);
            expect(newMeetingForm).toBeVisible();
            expect(Application.darkenedBackground).toBeVisible();
            expect(newMeetingForm.body.val()).toBe("What is your favorite vegatable?");
            expect(newMeetingForm.details.val()).toBe("mine's chard.");
          });
        });
      });

    });
  });

  describe("when the form is shown", function() {
    it("focuses the textarea", function() {
      expect(newMeetingForm.body).toHaveFocus();
    });

    it("clears out the old text from previous showings", function() {
      newMeetingForm.body.val("Junk");
      newMeetingForm.details.val("Garbage");
      newMeetingForm.close();
      newMeetingForm.show();
      expect(newMeetingForm.body.val()).toBe("");
      expect(newMeetingForm.details.val()).toBe("");
    });

    it("only shows the checkbox if the current team is public, otherwise it hides it and unchecks it", function() {
      expect(newMeetingForm.shareOnFacebook).toBeVisible();
      newMeetingForm.close();

      team.remotelyUpdated({privacy: "private"});
      newMeetingForm.show();

      expect(newMeetingForm.shareOnFacebook.attr('checked')).toBeFalsy();
      expect(newMeetingForm.shareOnFacebook).toBeHidden();
      newMeetingForm.close();

      team.remotelyUpdated({privacy: "public"});
      newMeetingForm.show();
      expect(newMeetingForm.shareOnFacebook.attr('checked')).toBeTruthy();
    });
  });

  describe("when typing in the body", function() {
    it("adjusts the chars remaining", function() {
      newMeetingForm.body.val("123")
      newMeetingForm.body.keyup();
      expect(newMeetingForm.charsRemaining.text()).toBe('137');
    });
  });

  describe("when enter is pressed in the body textarea", function() {
    it("submits the form", function() {
      newMeetingForm.body.val("What's your favorite kinda cheese?");
      newMeetingForm.body.trigger({ type : 'keydown', which : 13 });

      expect(Server.creates.length).toBe(1);

    });
  });

  describe("mixpanel tracking", function() {
    describe("when the form is submitted", function() {
      beforeEach(function() {
        spyOn(Application, 'showPage');
        mpq = [];
      });

      it("pushes a 'create meeting' event to the mixpanel queue", function() {
        newMeetingForm.body.val("What are you doing saturday night?");
        newMeetingForm.details.val("I am very lonely.");
        newMeetingForm.form.submit();
        Server.lastCreate.simulateSuccess({creatorId: Application.currentUserId()});

        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toBe('Create Meeting');
      });
    });
  });
});

