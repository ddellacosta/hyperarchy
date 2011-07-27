class MeetingsController < ApplicationController
  def index
    team = Team.find(params[:team_id])
    raise SecurityError unless team.current_user_can_read?

    offset = params[:offset]
    limit = params[:limit]

    meetings = team.meetings.offset(offset).limit(limit)
    meeting_creators = meetings.join(User, :creator_id => User[:id])
    agenda_items = meetings.join_through(AgendaItem).join(User, :creator_id => User[:id])
    visits = meetings.join_through(current_user.meeting_visits)
    
    render :json => build_client_dataset(meetings, meeting_creators, agenda_items, visits)
  end
end
