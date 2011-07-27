class Ranking < Prequel::Record
  column :id, :integer
  column :user_id, :integer
  column :meeting_id, :integer
  column :agenda_item_id, :integer
  column :vote_id, :integer
  column :position, :float
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :user
  belongs_to :agenda_item
  belongs_to :meeting
  belongs_to :vote

  attr_accessor :suppress_vote_update

  def can_create_or_update?
    false
  end
  alias can_create? can_create_or_update?
  alias can_update? can_create_or_update?

  def can_destroy?
    user_id == current_user.id
  end

  def team_ids
    meeting ? meeting.team_ids : []
  end

  def before_create
    self.meeting_id = agenda_item.meeting_id
    meeting.lock
    self.vote = meeting.votes.find_or_create(:user_id => user_id)
    vote.updated
  end

  def after_create
    if position > 0
      increment_victories_over(lower_positive_rankings_by_same_user)
      decrement_defeats_by(lower_positive_rankings_by_same_user)
      increment_victories_over(agenda_items_not_ranked_by_same_user)
    else
      increment_defeats_by(higher_negative_rankings_by_same_user)
      decrement_victories_over(higher_negative_rankings_by_same_user)
      increment_defeats_by(agenda_items_not_ranked_by_same_user)
    end

    meeting.compute_global_ranking
    meeting.unlock
  end

  def before_update(changeset)
    meeting.lock
  end

  def after_update(changeset)
    return unless changeset.changed?(:position)
    old_position = changeset.old(:position)
    if position > old_position
      after_ranking_moved_up(old_position)
    else
      after_ranking_moved_down(old_position)
    end

    meeting.votes.find(:user_id => user_id).updated
    meeting.compute_global_ranking
    meeting.unlock
  end

  def after_ranking_moved_up(old_position)
    previously_higher_rankings = lower_rankings_by_same_user.where(:position.gt(old_position))

    increment_victories_over(previously_higher_rankings)
    decrement_defeats_by(previously_higher_rankings)

    if position > 0 && old_position < 0
      increment_victories_over(agenda_items_not_ranked_by_same_user)
      decrement_defeats_by(agenda_items_not_ranked_by_same_user)
    end
  end

  def after_ranking_moved_down(old_position)
    previously_lower_rankings = higher_rankings_by_same_user.where(:position.lt(old_position))
    decrement_victories_over(previously_lower_rankings)
    increment_defeats_by(previously_lower_rankings)

    if position < 0 && old_position > 0
      decrement_victories_over(agenda_items_not_ranked_by_same_user)
      increment_defeats_by(agenda_items_not_ranked_by_same_user)
    end
  end

  def before_destroy
    meeting.lock
  end

  def after_destroy
    if position > 0
      decrement_victories_over(lower_positive_rankings_by_same_user)
      increment_defeats_by(lower_positive_rankings_by_same_user)
      decrement_victories_over(agenda_items_not_ranked_by_same_user)
    else
      increment_victories_over(higher_negative_rankings_by_same_user)
      decrement_defeats_by(higher_negative_rankings_by_same_user)
      decrement_defeats_by(agenda_items_not_ranked_by_same_user)
    end

    if rankings_by_same_user.empty?
      vote.destroy
    elsif !suppress_vote_update
      vote.updated
    end
    meeting.compute_global_ranking
    meeting.unlock
  end

  def increment_victories_over(rankings_or_agenda_items)
    victories_over(rankings_or_agenda_items).increment(:pro_count)
    defeats_by(rankings_or_agenda_items).increment(:con_count)
  end

  def decrement_victories_over(rankings_or_agenda_items)
    victories_over(rankings_or_agenda_items).decrement(:pro_count)
    defeats_by(rankings_or_agenda_items).decrement(:con_count)
  end

  def increment_defeats_by(rankings_or_agenda_items)
    defeats_by(rankings_or_agenda_items).increment(:pro_count)
    victories_over(rankings_or_agenda_items).increment(:con_count)
  end

  def decrement_defeats_by(rankings_or_agenda_items)
    defeats_by(rankings_or_agenda_items).decrement(:pro_count)
    victories_over(rankings_or_agenda_items).decrement(:con_count)
  end

  def victories_over(rankings_or_agenda_items)
    majorities_where_ranked_agenda_item_is_winner.
      join(rankings_or_agenda_items, :loser_id => agenda_item_id_join_column(rankings_or_agenda_items))
  end

  def defeats_by(rankings_or_agenda_items)
    majorities_where_ranked_agenda_item_is_loser.
      join(rankings_or_agenda_items, :winner_id => agenda_item_id_join_column(rankings_or_agenda_items))
  end

  def agenda_item_id_join_column(rankings_or_agenda_items)
    rankings_or_agenda_items.get_column(:agenda_item_id) ? :agenda_item_id : AgendaItem[:id]
  end

  def rankings_by_same_user
    Ranking.where(:user_id => user_id, :meeting_id => meeting_id)
  end

  def higher_rankings_by_same_user
    rankings_by_same_user.where(:position.gt(position))
  end

  def lower_rankings_by_same_user
    rankings_by_same_user.where(:position.lt(position))
  end

  def positive_rankings_by_same_user
    rankings_by_same_user.where(:position.gt(0))
  end

  def negative_rankings_by_same_user
    rankings_by_same_user.where(:position.lt(0))
  end 

  def higher_positive_rankings_by_same_user
    positive_rankings_by_same_user.where(:position.gt(position))
  end

  def lower_positive_rankings_by_same_user
    positive_rankings_by_same_user.where(:position.lt(position))
  end

  def higher_negative_rankings_by_same_user
    negative_rankings_by_same_user.where(:position.gt(position))
  end

  def lower_negative_rankings_by_same_user
    negative_rankings_by_same_user.where(:position.lt(position))
  end

  def majorities_where_ranked_agenda_item_is_winner
    Majority.where(:winner_id => agenda_item_id)
  end

  def majorities_where_ranked_agenda_item_is_loser
    Majority.where(:loser_id => agenda_item_id)
  end

  def all_rankings_for_same_agenda_item
    Ranking.where(:agenda_item_id => agenda_item_id)
  end

  def all_agenda_items_in_meeting
    AgendaItem.where(:meeting_id => meeting_id)
  end

  def agenda_items_not_ranked_by_same_user
    all_agenda_items_in_meeting.
      left_join(rankings_by_same_user).
      where(Ranking[:id] => nil).
      project(AgendaItem)
  end
end