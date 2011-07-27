require 'spec_helper'

describe ChannelSubscriptionsController do

  let(:team) { Team.make }

  describe "#create" do
    context "when the user is a member of the team being subscribed to" do
      it "posts a channel subscription to the websockets server with the given client session id" do
        team.update!(:privacy => 'private')
        user = team.make_member
        login_as(user)

        mock(controller).post(team.subscribe_url, :params => {:session_id => "fake_session_id", :reconnecting => '1'})
        post :create, :id => team.id, :session_id => "fake_session_id", :reconnecting => '1'
        response.should be_success
      end
    end

    context "when the user is NOT a member of the team being subscribed to" do
      before do
        user = User.make
        login_as(user)
        url = "http://#{SOCKET_SERVER_HOST}/channel_subscriptions/teams/#{team.id}"
      end

      context "when the team is private" do
        it "returns a status of 403: forbidden" do
          team.update!(:privacy => "private")
          post :create, :id => team.id, :session_id => "fake_session_id"
          response.should be_forbidden
        end
      end

      context "when the team is not private" do
        it "posts a channel subscription to the websockets server with the given client session id" do
          team.update!(:privacy => 'public')
          mock(controller).post(team.subscribe_url, :params => {:session_id => "fake_session_id"})
          post :create, :id => team.id, :session_id => "fake_session_id"
          response.should be_success
        end
      end
    end
  end

  describe "#destroy" do
    it "deletes a channel subscription on the socket server" do
      mock(controller).delete(team.subscribe_url, :params => {:session_id => "fake_session_id"})
      delete :destroy, :id => team.id, :session_id => "fake_session_id"
    end
  end
end
