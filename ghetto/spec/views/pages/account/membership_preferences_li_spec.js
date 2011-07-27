//= require spec/spec_helper

describe("Views.Pages.Account.MembershipPreferencesLi", function() {
  var membership, team, preferencesLi;

  beforeEach(function() {
    team = Team.createFromRemote({id: 1, name: "Crazy Eddie's"});
    membership = Membership.createFromRemote({
      id: 1,
      teamId: team.id(),
      notifyOfNewMeetings: "daily",
      notifyOfNewAgendaItems: "weekly",
      notifyOfNewNotesOnOwnAgendaItems: "never",
      notifyOfNewNotesOnRankedAgendaItems: "immediately"
    });
    preferencesLi = Views.Pages.Account.MembershipPreferencesLi.toView({membership: membership});
  });

  describe("#initialize", function() {
    it("assigns the team name and all the email preferences", function() {
      expect(preferencesLi.find('h3').text()).toBe("Email Preferences for " + team.name());
      expect(preferencesLi.find("[name='notifyOfNewMeetings']").val()).toBe(membership.notifyOfNewMeetings());
      expect(preferencesLi.find("[name='notifyOfNewAgendaItems']").val()).toBe(membership.notifyOfNewAgendaItems());
      expect(preferencesLi.find("[name='notifyOfNewNotesOnOwnAgendaItems']").val()).toBe(membership.notifyOfNewNotesOnOwnAgendaItems());
      expect(preferencesLi.find("[name='notifyOfNewNotesOnRankedAgendaItems']").val()).toBe(membership.notifyOfNewNotesOnRankedAgendaItems());
    });
  });

  describe("when an email preference is changed", function() {
    it("updates the membership record", function() {
      $('#jasmine_content').html(preferencesLi);
      useFakeServer();
      preferencesLi.find("[name='notifyOfNewMeetings']").val("weekly").change();
      expect(Server.updates.length).toBe(1);
      Server.lastUpdate.simulateSuccess();
      expect(membership.notifyOfNewMeetings()).toBe("weekly");
    });
  });
});