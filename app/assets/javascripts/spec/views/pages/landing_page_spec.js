//= require spec/spec_helper

describe("Views.Pages.Landing", function() {
  var landingPage;
  beforeEach(function() {
    timeTravelTo("07/27/2011 10:37am");
    renderLayout();
    landingPage = Application.landingPage;
    landingPage.show();
  });


  describe("date population", function() {
    it("auto-populates next Friday at the current time rounded down to the nearest half hour", function() {
      expect(landingPage.date.val()).toBe('07/29/2011');
      expect(landingPage.time.val()).toBe('10:30am');
    });
  });

  describe("scheduling a meeting", function() {
    it("prompts the user to sign up, then creates a meeting and navigates to it, then prompts them to invite their team", function() {
      waitsFor("user to sign up and meeting to be scheduled", function(complete) {
        enableAjax();
        landingPage.form.trigger('submit', complete);
        expect(Application.signupForm).toBeVisible();
        Application.signupForm.firstName.val("max");
        Application.signupForm.lastName.val("b");
        Application.signupForm.emailAddress.val("max@example.com");
        Application.signupForm.password.val("password");
        Application.signupForm.form.submit();
      });

      runs(function() {
        var meeting = Application.currentUser().meetings().first();
        expect(Path.routes.current).toBe(meeting.url());
        expect(Application.currentTeam()).toBe(meeting.team());
        expect(meeting.startsAt()).toEqual(Date.parse("07/29/2011 10:30am"));
        expect(Application.inviteBox).toBeVisible();
      });
    });
  });
});
