class MembershipsController < ApplicationController
  before_filter :require_authentication, :only => :confirm

  def create
    team = Team.find(:id => params[:team_id], :membership_code => params[:code])
    unless team
      redirect_to team_url(current_user.default_team)
      return
    end
    if current_user.guest?
      set_current_user(team.guest)
    elsif !current_user.memberships.find(:team => team)
      current_user.memberships.create!(:team => team)
    end
    
    redirect_to team_url(team)
  end
end
