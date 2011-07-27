class AgendaItem < Prequel::Record
  column :id, :integer
  column :body, :string
  column :details, :string, :default => ""
  column :question_id, :integer
  column :creator_id, :integer
  column :position, :integer
  column :created_at, :datetime
  column :updated_at, :datetime
  column :note_count, :integer, :default => 0

  belongs_to :question
  belongs_to :creator, :class_name => "User"
  has_many :rankings
  has_many :notes, :class_name => "AgendaItemNote"

  include SupportsNotifications

  attr_accessor :suppress_current_user_membership_check
  delegate :team, :to => :question

  def team_ids
    question ? question.team_ids : []
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
    [:body, :details, :question_id]
  end

  def update_whitelist
    [:body, :details]
  end

  def before_create
    ensure_body_within_limit
    team.ensure_current_user_is_member unless suppress_current_user_membership_check
    question.lock
    self.creator ||= current_user
  end

  def before_update(changeset)
    ensure_body_within_limit if changeset[:body]
  end

  def ensure_body_within_limit
    raise SecurityError, "Body exceeds 140 characters" if body.length > 140
  end

  def after_create
    update(:position => 1) if other_agenda_items.empty?
    other_agenda_items.each do |other_agenda_item|
      Majority.create({:winner => self, :loser => other_agenda_item, :question_id => question_id})
      Majority.create({:winner => other_agenda_item, :loser => self, :question_id => question_id})
    end

    victories_over(question.negative_agenda_item_ranking_counts).update(:pro_count => :times_ranked)
    victories_over(question.positive_agenda_item_ranking_counts).update(:con_count => :times_ranked)
    defeats_by(question.positive_agenda_item_ranking_counts).update(:pro_count => :times_ranked)
    defeats_by(question.negative_agenda_item_ranking_counts).update(:con_count => :times_ranked)

    question.compute_global_ranking
    question.unlock

    send_immediate_notifications
  end

  def before_destroy
    notes.each(&:destroy)
    question.lock
    rankings.each do |ranking|
      ranking.suppress_vote_update = true
      ranking.destroy
    end
    winning_majorities.each(&:destroy)
    losing_majorities.each(&:destroy)
  end

  def after_destroy
    question.unlock
  end

  def other_agenda_items
    question.agenda_items.where(AgendaItem[:id].neq(id))
  end

  def victories_over(other_agenda_item_ranking_counts)
    winning_majorities.
      join(other_agenda_item_ranking_counts, :loser_id => :agenda_item_id)
  end

  def defeats_by(other_agenda_item_ranking_counts)
    losing_majorities.
      join(other_agenda_item_ranking_counts, :winner_id => :agenda_item_id)
  end

  def winning_majorities
    question.majorities.where(:winner_id => id)
  end

  def losing_majorities
    question.majorities.where(:loser_id => id)
  end

  def users_to_notify_immediately
    question.votes.
      join(Membership.where(:team_id => question.team_id), Vote[:user_id].eq(Membership[:user_id])).
      where(:notify_of_new_agenda_items => "immediately").
      where(Membership[:user_id].neq(creator_id)).
      join_through(User)
  end

  def extra_records_for_create_events
    [creator]
  end
end