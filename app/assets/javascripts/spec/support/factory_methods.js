Team.prototype.makeMember = function(attributes) {
  var user = User.createFromRemote(attributes);
  this.memberships().createFromRemote({id: Membership.size() + 1, userId: user.id(), role: "member"});
  return user;
};

Team.prototype.makeOwner = function(attributes) {
  var user = User.createFromRemote(attributes);
  this.memberships().createFromRemote({id: Membership.size() + 1, userId: user.id(), role: "owner"});
  return user;
};