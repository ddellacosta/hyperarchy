require 'spec_helper'

describe RankingsController do
  attr_reader :team, :member, :non_member, :meeting, :c1, :c2

  before do
    @team = Team.make
    @meeting = team.meetings.make
    @c1 = meeting.agenda_items.make
    @c2 = meeting.agenda_items.make
    @member = team.make_member
    @non_member = User.make
  end

  context "when authenticated as a member of the ranked meeting's team" do
    before do
      login_as member
    end

    context "when no ranking for the specified agenda_item exists for the current user" do
      it "creates a ranking" do
        Ranking.find(:user => member, :agenda_item => c1).should be_nil

        post :create, :agenda_item_id => c1.to_param, :position => '64'
        response.should be_success

        c1_ranking = Ranking.find(:user => member, :agenda_item => c1)
        c1_ranking.position.should == 64

        response_json['data'].should == { 'ranking_id' => c1_ranking.id }
        response_json["records"]["rankings"].should have_key(c1_ranking.to_param)
      end
    end

    context "when a ranking for the specified agenda_item already exists for the current user" do
      it "updates its position" do
        c1_ranking = Ranking.create!(:user => member, :agenda_item => c1, :position => 32)

        post :create, :agenda_item_id => c1.id, :position => 64
        response.should be_success

        c1_ranking.position.should == 64
        
        response_json['data'].should == { 'ranking_id' => c1_ranking.id }
        response_json["records"]["rankings"].should have_key(c1_ranking.to_param)
      end
    end
  end

  context "when authenticated as a user that is not a member of the ranked meeting's team" do
    before do
      login_as(non_member)
    end

    context "if the team is public" do
      before do
        team.update(:privacy => 'public')
      end

      it "makes the user a member of the team before proceeding and includes the new membership in the returned records" do
        Ranking.find(:user => member, :agenda_item => c1).should be_nil
        non_member.memberships.where(:team => team).should be_empty

        post :create, :agenda_item_id => c1.id, :position => 64
        response.should be_success

        new_membership = non_member.memberships.find(:team => team)
        new_membership.should be
        c1_ranking = Ranking.find(:user => non_member, :agenda_item => c1)
        c1_ranking.position.should == 64

        response_json['data'].should == { 'ranking_id' => c1_ranking.id }
        response_json['records']['memberships'].should have_key(new_membership.to_param)
        response_json['records']['rankings'].should have_key(c1_ranking.to_param)
      end
    end

    context "if the team is not public" do
      before do
        team.privacy.should_not == 'public'
      end

      it "returns a security error" do
        post :create, :agenda_item_id => c1.id, :position => 64
        response.status.should == 403
      end
    end
  end

  context "when not authenticated" do
    it "returns a security error" do
      post :create
      response.status.should == 403
    end
  end

  context "when only authenticated as a guest" do
    it "returns a security error" do
      post :create
      response.status.should == 403
    end
  end
end
