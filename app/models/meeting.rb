class Meeting < Prequel::Record
  column :id, :integer
  column :team_id, :integer
  column :creator_id, :integer
  column :starts_at, :datetime
  column :body, :string
  column :details, :string
  column :vote_count, :integer, :default => 0
  column :score, :float
  column :created_at, :datetime
  column :updated_at, :datetime

  has_many :agenda_items
  has_many :votes
  has_many :rankings
  has_many :majorities
  has_many :meeting_visits

  belongs_to :creator, :class_name => "User"
  belongs_to :team

  attr_accessor :suppress_current_user_membership_check

  include SupportsNotifications

  class << self
    def update_scores
      Prequel::DB.execute(%{
        update meetings set score = ((vote_count + #{SCORE_EXTRA_HOURS}) / pow((extract(epoch from (now() - created_at)) / 3600) + 2, 1.8))
      })
    end

    def compute_score(vote_count, age_in_hours)
      (vote_count + SCORE_EXTRA_HOURS) / ((age_in_hours + SCORE_EXTRA_HOURS) ** SCORE_GRAVITY)
    end
  end

  SCORE_EXTRA_VOTES = 1
  SCORE_EXTRA_HOURS = 2
  SCORE_GRAVITY = 1.8
  INITIAL_SCORE = compute_score(0, 0)

  def can_create?
    if team
      team.current_user_can_create_items?
    else
      true
    end
  end

  def can_update_or_destroy?
    current_user.admin? || creator_id == current_user.id || team.has_owner?(current_user)
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def create_whitelist
    [:team_id, :body, :details, :starts_at]
  end

  def update_whitelist
    [:body, :details, :starts_at]
  end

  def team_ids
    [team_id]
  end

  def before_create
    self.team ||= Team.create!(:name => "#{current_user.full_name}'s Team")
    team.ensure_current_user_is_member unless suppress_current_user_membership_check
    self.creator ||= current_user
    self.score = INITIAL_SCORE
  end

  def before_update(changeset)
    self.score = compute_score if changeset.changed?(:vote_count)
  end

  def after_create
    team.increment(:meeting_count)
    send_immediate_notifications
  end

  def users_to_notify_immediately
    team.memberships.
      where(:notify_of_new_meetings => "immediately").
      where(Membership[:user_id].neq(creator_id)).
      join_through(User)
  end

  def before_destroy
    agenda_items.each(&:destroy)
    meeting_visits.each(&:destroy)
  end

  def after_destroy
    team.decrement(:meeting_count)
  end

  def compute_global_ranking
    already_processed = []
    graph = RGL::DirectedAdjacencyGraph.new

    majorities.order_by(Majority[:pro_count].desc, Majority[:con_count].asc, Majority[:winner_created_at].asc).each do |majority|
      winner_id = majority.winner_id
      loser_id = majority.loser_id
      next if already_processed.include?([loser_id, winner_id])
      already_processed.push([winner_id, loser_id])
      graph.add_edge(winner_id, loser_id)
      graph.remove_edge(winner_id, loser_id) unless graph.acyclic?
    end

    graph.topsort_iterator.each_with_index do |agenda_item_id, index|
      agenda_item = agenda_items.find(agenda_item_id)
      agenda_item.update!(:position => index + 1)
    end

    update!(:updated_at => Time.now)
  end

  def positive_rankings
    rankings.where(Ranking[:position].gt(0))
  end

  def negative_rankings
    rankings.where(Ranking[:position].lt(0))
  end

  def positive_agenda_item_ranking_counts
    times_each_agenda_item_is_ranked(positive_rankings)
  end

  def negative_agenda_item_ranking_counts
    times_each_agenda_item_is_ranked(negative_rankings)
  end

  def times_each_agenda_item_is_ranked(relation)
    relation.
      group_by(:agenda_item_id).
      project(:agenda_item_id, Ranking[:id].count.as(:times_ranked))
  end

  def ranked_agenda_items
    agenda_items.
      join(rankings).
      project(AgendaItem)
  end

  def compute_score
    self.class.compute_score(vote_count, age_in_hours)
  end

  def age_in_hours
    (Time.now.to_i - created_at.to_i) / 3600
  end
end
