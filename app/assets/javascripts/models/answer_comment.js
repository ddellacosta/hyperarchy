//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

AnswerComment = Monarch("AnswerComment", {
  answerId: 'key',
  creatorId: 'key',
  body: 'string',
  updatedAt: 'datetime',
  createdAt: 'datetime'
})
  .belongsTo('answer')
  .belongsTo('creator', {className: "User"})

  .include({
    belongsToCurrentUser: function() {
      return this.creator() === Application.currentUser();
    },

    editableByCurrentUser: function() {
      return Application.currentUser().admin() || this.belongsToCurrentUser() || this.organization().currentUserIsOwner();
    },

    organization: function() {
      return this.question().organization();
    },

    question: function() {
      return this.answer().question();
    },

    formattedCreatedAt: function() {
      return $.PHPDate("n/j/y g:ia", this.createdAt());
    },

    mixpanelNote: function() {
      return this.body();
    }
  });

