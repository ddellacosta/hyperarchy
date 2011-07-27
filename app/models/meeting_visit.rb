class MeetingVisit < Prequel::Record
  column :id, :integer
  column :meeting_id, :integer
  column :user_id, :integer
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :meeting
  belongs_to :user

  def team_ids
    meeting ? meeting.team_ids : []
  end
end
