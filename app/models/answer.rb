#  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
#  licensed under the Affero General Public License version 3 or later.  See
#  the COPYRIGHT file.

class Answer < Prequel::Record
  column :id, :integer
  column :body, :string
  column :details, :string, :default => ""
  column :question_id, :integer
  column :creator_id, :integer
  column :position, :integer
  column :created_at, :datetime
  column :updated_at, :datetime
  column :comment_count, :integer, :default => 0

  belongs_to :question
  belongs_to :creator, :class_name => "User"
  has_many :rankings
  has_many :comments, :class_name => "AnswerComment"

  include SupportsNotifications

  attr_accessor :suppress_current_user_membership_check
  delegate :organization, :to => :question

  def organization_ids
    question ? question.organization_ids : []
  end

  def can_create?
    organization.current_user_can_create_items?
  end

  def can_update_or_destroy?
    current_user.admin? || creator_id == current_user.id || question.organization.has_owner?(current_user)
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
    organization.ensure_current_user_is_member unless suppress_current_user_membership_check
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
    update(:position => 1) if other_answers.empty?
    other_answers.each do |other_answer|
      Majority.create({:winner => self, :loser => other_answer, :question_id => question_id})
      Majority.create({:winner => other_answer, :loser => self, :question_id => question_id})
    end

    victories_over(question.negative_answer_ranking_counts).update(:pro_count => :times_ranked)
    victories_over(question.positive_answer_ranking_counts).update(:con_count => :times_ranked)
    defeats_by(question.positive_answer_ranking_counts).update(:pro_count => :times_ranked)
    defeats_by(question.negative_answer_ranking_counts).update(:con_count => :times_ranked)

    question.compute_global_ranking
    question.unlock

    send_immediate_notifications
  end

  def before_destroy
    comments.each(&:destroy)
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

  def other_answers
    question.answers.where(Answer[:id].neq(id))
  end

  def victories_over(other_answer_ranking_counts)
    winning_majorities.
      join(other_answer_ranking_counts, :loser_id => :answer_id)
  end

  def defeats_by(other_answer_ranking_counts)
    losing_majorities.
      join(other_answer_ranking_counts, :winner_id => :answer_id)
  end

  def winning_majorities
    question.majorities.where(:winner_id => id)
  end

  def losing_majorities
    question.majorities.where(:loser_id => id)
  end

  def users_to_notify_immediately
    question.votes.
      join(Membership.where(:organization_id => question.organization_id), Vote[:user_id].eq(Membership[:user_id])).
      where(:notify_of_new_answers => "immediately").
      where(Membership[:user_id].neq(creator_id)).
      join_through(User)
  end

  def extra_records_for_create_events
    [creator]
  end
end