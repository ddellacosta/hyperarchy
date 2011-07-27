class SharesController < ApplicationController
  def create
    Share.create!(params.slice(:code, :service, :meeting_id))
    head :ok
  end
end
