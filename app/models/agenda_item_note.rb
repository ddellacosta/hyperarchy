class AgendaItemNote < Prequel::Record
  column :id, :integer
  column :body, :string
  column :agenda_item_id, :integer
  column :creator_id, :integer
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :agenda_item
  belongs_to :creator, :class_name => "User"
  attr_accessor :suppress_current_user_membership_check
  delegate :team, :to => :agenda_item

  include SupportsNotifications

  def team_ids
    agenda_item ? agenda_item.team_ids : []
  end

  def question
    agenda_item.question
  end

  def can_create?
    team.current_user_can_create_items?
  end

  def can_update_or_destroy?
    current_user.admin? || creator_id == current_user.id || question.team.has_owner?(current_user)
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def create_whitelist
    [:body, :agenda_item_id]
  end

  def update_whitelist
    [:body]
  end

  def before_create
    team.ensure_current_user_is_member unless suppress_current_user_membership_check
    self.creator ||= current_user
  end

  def after_create
    send_immediate_notifications
    agenda_item.increment(:note_count)
  end

  def after_destroy
    agenda_item.decrement(:note_count)
  end

  def users_to_notify_immediately
    users_who_ranked_my_agenda_item = agenda_item.
      rankings.
      join(User).
      join(team.memberships).
      where(:notify_of_new_notes_on_ranked_agenda_items => "immediately").
      where(Membership[:user_id].neq(creator_id)).
      project(User)

    user_who_created_my_agenda_item = agenda_item.
      team.
        memberships.where(:user_id => agenda_item.creator_id, :notify_of_new_notes_on_own_agenda_items => "immediately").
        join_through(User)

    users_who_ranked_my_agenda_item | user_who_created_my_agenda_item
  end

  def extra_records_for_create_events
    [creator]
  end
end