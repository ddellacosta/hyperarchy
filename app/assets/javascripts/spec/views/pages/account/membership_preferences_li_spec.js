//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Views.Pages.Account.MembershipPreferencesLi", function() {
  var membership, organization, preferencesLi;

  beforeEach(function() {
    organization = Organization.created({id: 1, name: "Crazy Eddie's"});
    membership = Membership.created({
      id: 1,
      organizationId: organization.id(),
      notifyOfNewQuestions: "daily",
      notifyOfNewAnswers: "weekly",
      notifyOfNewCommentsOnOwnAnswers: "never",
      notifyOfNewCommentsOnRankedAnswers: "immediately"
    });
    preferencesLi = Views.Pages.Account.MembershipPreferencesLi.toView({membership: membership});
  });

  describe("#initialize", function() {
    it("assigns the organization name and all the email preferences", function() {
      expect(preferencesLi.find('h3').text()).toBe("Email Preferences for " + organization.name());
      expect(preferencesLi.find("[name='notifyOfNewQuestions']").val()).toBe(membership.notifyOfNewQuestions());
      expect(preferencesLi.find("[name='notifyOfNewAnswers']").val()).toBe(membership.notifyOfNewAnswers());
      expect(preferencesLi.find("[name='notifyOfNewCommentsOnOwnAnswers']").val()).toBe(membership.notifyOfNewCommentsOnOwnAnswers());
      expect(preferencesLi.find("[name='notifyOfNewCommentsOnRankedAnswers']").val()).toBe(membership.notifyOfNewCommentsOnRankedAnswers());
    });
  });

  describe("when an email preference is changed", function() {
    it("updates the membership record", function() {
      $('#jasmine_content').html(preferencesLi);
      useFakeServer();
      preferencesLi.find("[name='notifyOfNewQuestions']").val("weekly").change();
      expect(Server.updates.length).toBe(1);
      Server.lastUpdate.simulateSuccess();
      expect(membership.notifyOfNewQuestions()).toBe("weekly");
    });
  });
});
