class MeetingVisitsController < ApplicationController
  def create
    head :ok and return if current_user.guest?
    visit = current_user.meeting_visits.find_or_create(:meeting_id => params[:meeting_id])
    visit.update(:updated_at => Time.now)
    render :json => build_client_dataset(visit)
  end
end
