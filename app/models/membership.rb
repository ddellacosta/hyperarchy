class Membership < Prequel::Record
  column :id, :integer
  column :team_id, :integer
  column :user_id, :integer
  column :role, :string, :default => "member"
  column :last_visited, :datetime
  column :notify_of_new_meetings, :string, :default => "daily"
  column :notify_of_new_agenda_items, :string, :default => "daily"
  column :notify_of_new_notes_on_own_agenda_items, :string, :default => "daily"
  column :notify_of_new_notes_on_ranked_agenda_items, :string, :default => "daily"
  column :created_at, :datetime
  column :updated_at, :datetime

  synthetic_column :first_name, :string
  synthetic_column :last_name, :string
  synthetic_column :email_address, :string

  belongs_to :team
  belongs_to :user

  attr_writer :email_address, :first_name, :last_name
  delegate :email_address, :first_name, :last_name, :to => :user

  def current_user_is_admin_or_team_owner?
    current_user.admin? || team.has_owner?(current_user)
  end
  alias can_create? current_user_is_admin_or_team_owner?
  alias can_destroy? current_user_is_admin_or_team_owner?

  def can_update?
    current_user_is_admin_or_team_owner? || user == current_user
  end

  def create_whitelist
    [:team_id, :user_id, :role, :first_name, :last_name, :email_address,
     :notify_of_new_meetings, :notify_of_new_agenda_items,
     :notify_of_new_notes_on_ranked_agenda_items,
     :notify_of_new_notes_on_own_agenda_items]
  end

  def update_whitelist
    if current_user_is_admin_or_team_owner?
      [:first_name, :last_name, :role, :last_visited,
       :notify_of_new_meetings, :notify_of_new_agenda_items,
       :notify_of_new_notes_on_ranked_agenda_items,
       :notify_of_new_notes_on_own_agenda_items]
    else
      [:last_visited, :notify_of_new_meetings, :notify_of_new_agenda_items,
       :notify_of_new_notes_on_ranked_agenda_items,
       :notify_of_new_notes_on_own_agenda_items]
    end
  end

  # dont send email address to another user unless they are an admin or owner
  def read_blacklist
    if current_user_can_read_email_address?
      super
    else
      [:email_address]
    end
  end

  def current_user_can_read_email_address?
    p self.inspect
    p user.inspect
    return false unless current_user
    user == current_user || current_user.admin? || team.current_user_is_owner?
  end

  def team_ids
    [team_id]
  end

  def email_address
    @email_address || (user ? user.email_address : nil)
  end

  def first_name
    @first_name || (user ? user.first_name : nil)
  end

  def last_name
    @last_name || (user ? user.last_name : nil)
  end

  def before_create
    self.last_visited = Time.now

    if user = User.find(:email_address => email_address)
      self.user = user
    end
  end

  def wants_notifications?(period)
     wants_meeting_notifications?(period) ||
       wants_agenda_item_notifications?(period) ||
       wants_ranked_agenda_item_note_notifications?(period) ||
       wants_own_agenda_item_note_notifications?(period)

  end

  def wants_agenda_item_notifications?(period)
    notify_of_new_agenda_items == period
  end

  def wants_meeting_notifications?(period)
    notify_of_new_meetings == period
  end

  def wants_ranked_agenda_item_note_notifications?(period)
    notify_of_new_notes_on_ranked_agenda_items == period
  end

  def wants_own_agenda_item_note_notifications?(period)
    notify_of_new_notes_on_own_agenda_items == period
  end

  def new_meetings_in_period(period)
    team.meetings.
      where(Meeting[:created_at].gt(last_notified_or_visited_at(period))).
      where(Meeting[:creator_id].neq(user_id))
  end

  def new_agenda_items_in_period(period)
    user.votes.
      join(team.meetings).
      join_through(AgendaItem).
      where(AgendaItem[:created_at].gt(last_notified_or_visited_at(period))).
      where(AgendaItem[:creator_id].neq(user_id))
  end

  def new_notes_on_ranked_agenda_items_in_period(period)
    team.meetings.
      join(user.rankings).
      join(AgendaItem, Ranking[:agenda_item_id] => AgendaItem[:id]).
      where(AgendaItem[:creator_id].neq(user_id)).
      join_through(AgendaItemNote).
      where(AgendaItemNote[:created_at].gt(last_notified_or_visited_at(period))).
      where(AgendaItemNote[:creator_id].neq(user_id))
  end

  def new_notes_on_own_agenda_items_in_period(period)
    team.meetings.
      join(user.agenda_items).
      join_through(AgendaItemNote).
      where(AgendaItemNote[:created_at].gt((last_notified_or_visited_at(period)))).
      where(AgendaItemNote[:creator_id].neq(user_id))
  end

  protected

  # returns the time of last visit or the 1 <period> ago, whichever is more recent
  def last_notified_or_visited_at(period)
    [period_ago(period), last_visited].compact.max
  end

  def period_ago(period)
    case period
      when "every5"
        1.minute.ago
      when "hourly"
        1.hour.ago
      when "daily"
        1.day.ago
      when "weekly"
        1.week.ago
    end
  end
end
