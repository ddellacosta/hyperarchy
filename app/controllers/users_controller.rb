class UsersController < ApplicationController
  def new
    @user = User.new
  end

  def create
    errors = []
    Prequel.transaction do
      data = {}
      create_user(data, errors)
      create_team(data, errors) if params[:team]

      render :json => {
        'data' => data,
        'records' => build_client_dataset(current_user.initial_repository_contents)
      }

      return
    end

    render :status => 422, :json => errors
  end

  protected

  def create_user(data, errors)
    user = User.secure_create(params[:user])
    user.associate_referring_share(session[:share_code]) if session[:share_code]
    if user.valid?
      previous_user = current_user
      set_current_user(user)
      if team = previous_user.guest_team
        current_user.memberships.find_or_create!(:team => team)
      end
      data['current_user_id'] = user.id
    else
      errors.push(*user.errors.full_messages)
      raise Prequel::Rollback
    end
  end

  def create_team(data, errors)
    team = Team.secure_create(params[:team])
    if team.valid?
      data['new_team_id'] = team.id
    else
      errors.push(*team.errors.full_messages)
      clear_current_user
      raise Prequel::Rollback
    end
  end
end
