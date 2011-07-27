require 'spec_helper'

describe MeetingsController do
  attr_reader :public_org, :private_org, :member_org, :member

  describe "#index" do
    before do
      @public_org = Team.make(:privacy => 'public')
      @private_org = Team.make(:privacy => 'private')
      @member_org = Team.make(:privacy => "private")
      @member = User.make
      member_org.memberships.make(:user => member)
    end

    def perform_get(team)
      xhr :get, :index, :team_id => team.id, :offset => 0, :limit => 1
    end

    context "if authenticated as a default guest" do
      it "only allows the user to read meetings from publicly readable teams" do
        perform_get(private_org)
        response.should be_forbidden

        perform_get(public_org)
        response.should be_success
      end
    end

    context "if authenticated as a member" do
      before do
        login_as(member)
      end

      it "allows the user to read meetings from publicly readable teams and teams they are members of" do
        perform_get(private_org)
        response.should be_forbidden

        perform_get(public_org)
        response.should be_success

        perform_get(member_org)
        response.should be_success
      end
    end

    context "if authenticated as an admin" do
      before do
        login_as(User.make(:admin => true))
      end

      it "allows the user to read meetings from anywhere" do
        perform_get(private_org)
        response.should be_success

        perform_get(public_org)
        response.should be_success

        perform_get(member_org)
        response.should be_success
      end
    end
  end
end
