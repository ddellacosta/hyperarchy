//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

Vote = Monarch("Vote", {
  userId: 'key',
  questionId: 'key',
  updatedAt: 'datetime'
})
  .syntheticColumn('formattedUpdatedAt', function() {
    return this.signal('updatedAt', function(updatedAt) {
      if (updatedAt) {
        return $.PHPDate("M j, Y @ g:ia", updatedAt);
      } else {
        return null;
      }
    });
  })

  .belongsTo('question')
  .belongsTo('user')
  .hasMany('rankings')

  .include({
    url: function() {
      var url = "/questions/" + this.questionId();
      if (this.userId() !== Application.currentUserId()) url += '/votes/' + this.userId();
      return url;
    },

    trackView: function() {
      mpq.push(["track", "View Ranking", this.mixpanelProperties()]); // keeping this around for retention on early users. will retire in a few months
      mpq.push(["track", "View Vote", this.mixpanelProperties()]);
    },

    mixpanelNote: function() {
      return this.user().fullName();
    }
  });

