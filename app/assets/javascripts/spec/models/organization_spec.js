//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Organization", function() {
  var organization;

  beforeEach(function() {
    organization = Organization.created({id: 22, questionCount: 32});
  });

  describe(".findSocial", function() {
    it("returns the social organization", function() {
      var nonSocial = Organization.created({id: 1, social: false});
      var social = Organization.created({id: 2, social: true});
      expect(Organization.findSocial()).toBe(social);
    });
  });

  describe("#fetchMoreQuestions", function() {
    it("fetches questions in blocks, first of 16, then of 24 with 8 questions of overlap with the previously fetched block", function() {
      expect(organization.numQuestionsFetched).toBe(0);

      organization.fetchMoreQuestions();
      expect($.ajax).toHaveBeenCalledWith({
        url: "/questions",
        data: {
          organization_id: organization.id(),
          offset: 0,
          limit: 16
        },
        dataType: 'records'
      });

      $.ajax.reset();
      organization.fetchMoreQuestions();
      expect($.ajax).not.toHaveBeenCalled();

      simulateAjaxSuccess();
      expect(organization.numQuestionsFetched).toBe(16);

      organization.fetchMoreQuestions();

      expect($.ajax).toHaveBeenCalledWith({
        url: "/questions",
        data: {
          organization_id: organization.id(),
          offset: 8,
          limit: 24
        },
        dataType: 'records'
      });

      simulateAjaxSuccess();

      expect(organization.numQuestionsFetched).toBe(32);

      $.ajax.reset();

      organization.fetchMoreQuestions(); // num fetched == question count
      expect($.ajax).not.toHaveBeenCalled();
    });
  });


  describe("#url", function() {
    it("returns the correct url", function() {
      expect(organization.url()).toEqual('/organizations/22');
    });
  });
});
