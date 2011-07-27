class RankingsController < ApplicationController
  def create
    raise SecurityError if !current_user || current_user.guest?

    team = AgendaItem.find(params[:agenda_item_id]).question.team
    new_membership = team.ensure_current_user_is_member

    attributes = { :user_id => current_user.id, :agenda_item_id => params[:agenda_item_id] }

    if ranking = Ranking.find(attributes)
      ranking.update(:position => params[:position])
    else
      ranking = Ranking.create!(attributes.merge(:position => params[:position]))
    end

    render :json => {
      :data => {:ranking_id => ranking.id},
      :records => build_client_dataset([ranking, new_membership].compact)
    }
  end
end
