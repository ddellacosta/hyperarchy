//= require spec/spec_helper

describe("Views.Lightboxes.AddTeamForm", function() {
  var addTeamForm;
  beforeEach(function() {
    renderLayout();
    addTeamForm = Application.addTeamForm.show();

    enableAjax();
    login();

  });

  describe("when the form is submitted", function() {
    it("creates an team, then fetches the current user's membership, hides the form, and navigates to the team's page", function() {
      mpq = [];
      spyOn(Application, 'showPage');

      addTeamForm.name.val("Facebook Users");

      waitsFor("team to be created", function(complete) {
        addTeamForm.form.trigger('submit', complete);
      });

      runs(function() {
        expect(addTeamForm).toBeVisible();
        expect(Path.routes.current).toBe("/initial_url");
      });

      var team;
      waitsFor("membership of current user to be fetched", function() {
        team = Team.find({name: "Facebook Users"});
        return team.membershipForCurrentUser();
      });

      runs(function() {
        expect(addTeamForm).toBeHidden();
        expect(Path.routes.current).toBe(team.url());

        expectMixpanelAction('track', 'Create Team');
      });
    });
  });
});