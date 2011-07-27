class Vote < Prequel::Record
  column :id, :integer
  column :user_id, :integer
  column :meeting_id, :integer
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :user
  belongs_to :meeting

  def can_mutate?
    false
  end
  alias can_create? can_mutate?
  alias can_update? can_mutate?
  alias can_destroy? can_mutate?

  def team_ids
    meeting ? meeting.team_ids : []
  end

  # note: this approach to incrementing / decrementing is not atomic!
  # but currently plan to serialize all operations per meeting so it's ok
  # we want to go through the record so the update gets broadcast
  def after_create
    meeting.vote_count = meeting.vote_count + 1
    meeting.save
  end

  def after_destroy
    meeting.vote_count -= 1
    meeting.save
  end

  def updated
    update(:updated_at => Time.now)
  end

  def extra_records_for_create_events
    [user]
  end
end