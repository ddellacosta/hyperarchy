//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

Membership = Monarch("Membership", {
  organizationId: "key",
  userId: "key",
  role: "string",
  firstName: "string",
  lastName: "string",
  emailAddress: "string",
  lastVisited: "datetime",
  notifyOfNewQuestions: "string",
  notifyOfNewAnswers: "string",
  notifyOfNewCommentsOnOwnAnswers: "string",
  notifyOfNewCommentsOnRankedAnswers: "string"
})
  .belongsTo("organization")
  .belongsTo("user")

  .include({
    fullName: function() {
      if (this.firstName() && this.lastName()) {
        return this.firstName() + " " + this.lastName();
      } else {
        return null;
      }
    }
  });

