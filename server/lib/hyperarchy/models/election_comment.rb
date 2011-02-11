class ElectionComment < Monarch::Model::Record
  column :body, :string
  column :election_id, :key
  column :creator_id, :key
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :election
  belongs_to :creator, :class_name => "User"
  attr_accessor :suppress_notification_email
  delegate :organization, :to => :election

  def organization_ids
    election ? election.organization_ids : []
  end

  def can_create?
    election.organization.has_member?(current_user)
  end

  def can_update_or_destroy?
    current_user.admin? || creator_id == current_user.id || election.organization.has_owner?(current_user)
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def create_whitelist
    [:body, :election_id]
  end

  def update_whitelist
    [:body]
  end

  def before_create
    self.creator ||= current_user
  end

  def after_create
    unless suppress_notification_email
      Hyperarchy.defer { Hyperarchy::Notifier.send_immediate_notifications(self) }
    end
  end

  def users_to_notify_immediately
    notify_users = election.votes.
      join(Membership.where(:organization_id => election.organization_id)).
        on(Vote[:user_id].eq(Membership[:user_id])).
      where(:notify_of_new_comments_on_voted_elections => "immediately").
      where(Membership[:user_id].neq(creator_id)).
      join_through(User).all

    election_creator_membership = organization.memberships.find(:user_id => election.creator_id)
    if election_creator_membership && election_creator_membership.wants_own_election_comment_notifications?("immediately")
      notify_users.push(election.creator)
    end
    notify_users
  end

end