require 'spec_helper'

module Models
  describe Meeting do
    attr_reader :meeting, :team, :creator, :memphis, :knoxville, :chattanooga, :nashville, :unranked

    before do
      freeze_time

      @team = Team.make
      @creator = team.make_member
      @meeting = team.meetings.make(:body => "Where should the capital of Tennesee be?", :creator => creator)
      @memphis = meeting.agenda_items.make(:body => "Memphis")
      @knoxville = meeting.agenda_items.make(:body => "Knoxville")
      @chattanooga = meeting.agenda_items.make(:body => "Chattanooga")
      @nashville = meeting.agenda_items.make(:body => "Nashville")
      @unranked = meeting.agenda_items.make(:body => "Unranked")
    end


    describe ".update_scores" do
      it "causes scores to go down as time passes" do
        initial_score = meeting.score

        meeting.update(:created_at => 1.hour.ago)
        Meeting.update_scores
        
        meeting.reload.score.should be < initial_score
      end

      it "causes scores to go up as votes are added" do
        initial_score = meeting.score

        meeting.update(:vote_count => 10)
        Meeting.update_scores
        
        meeting.reload.score.should be > initial_score
      end
    end

    describe "before create" do
      it "if the creator is not a member of the meeting's team, makes them one (as long as the org is public)" do
        set_current_user(User.make)
        current_user.memberships.where(:team => team).should be_empty

        team.update(:privacy => "private")
        expect do
          team.meetings.create!(:body => "foo")
        end.should raise_error(SecurityError)

        team.update(:privacy => "public")
        team.meetings.create!(:body => "foo")

        current_user.memberships.where(:team => team).size.should == 1
      end

      it "assigns the creator to the Model::Record.current_user" do
        set_current_user(User.make)
        meeting = Meeting.make
        meeting.creator.should == current_user
      end

      it "assigns a score" do
        meeting.score.should_not be_nil
      end
    end

    describe "after create" do
      attr_reader :team, :creator, :opted_in, :opted_out, :non_member

      before do
        @team = Team.make
        @creator = User.make
        @opted_in = User.make
        @opted_out = User.make
        @non_member = User.make

        team.memberships.make(:user => creator, :notify_of_new_meetings => "immediately")
        team.memberships.make(:user => opted_in, :notify_of_new_meetings => "immediately")
        team.memberships.make(:user => opted_out, :notify_of_new_meetings => "never")

        set_current_user(creator)
      end

      it "enqueues a SendImmediateNotification job with the meeting" do
        job_params = nil
        mock(Jobs::SendImmediateNotifications).create(is_a(Hash)) do |params|
          job_params = params
        end
        
        meeting = team.meetings.create!(:body => "What should we eat for dinner?")
        job_params.should ==  { :class_name => "Meeting", :id => meeting.id }
      end

      it "increments the meeting count on its team" do
        lambda do
          team.meetings.create!(:body => "What should we eat for dinner?")
        end.should change { team.meeting_count }.by(1)
      end
    end

    describe "before update" do
      it "updates the score if the vote count changed" do
        score_before = meeting.score
        meeting.vote_count += 1
        meeting.save
        meeting.score.should be > score_before
      end
    end

    describe "before destroy" do
      it "destroys any agenda_items, agenda_item notes, votes and visits that belong to the meeting" do
        meeting = Meeting.make
        user_1 = meeting.team.make_member
        user_2 = meeting.team.make_member
        agenda_item_1 = meeting.agenda_items.make
        agenda_item_2 = meeting.agenda_items.make
        agenda_item_1.notes.make
        agenda_item_2.notes.make

        Ranking.create!(:user => user_1, :agenda_item => agenda_item_1, :position => 64)
        Ranking.create!(:user => user_1, :agenda_item => agenda_item_2, :position => 32)
        Ranking.create!(:user => user_2, :agenda_item => agenda_item_1, :position => 64)
        meeting.meeting_visits.create!(:user => user_1)

        meeting.meeting_visits.size.should == 1
        meeting.agenda_items.size.should == 2
        meeting.votes.size.should == 2
        meeting.agenda_items.join_through(AgendaItemNote).size.should == 2
        meeting.destroy
        meeting.agenda_items.should be_empty
        meeting.votes.should be_empty
        meeting.meeting_visits.should be_empty
        meeting.agenda_items.join_through(AgendaItemNote).should be_empty
      end
    end

    describe "after destroy" do
      it "decrements the meeting count on its team" do
        meeting = Meeting.make
        lambda do
          meeting.destroy
        end.should change { meeting.team.meeting_count }.by(-1)
      end
    end

    describe "#compute_global_ranking" do
      it "uses the ranked-pairs algoritm to produce a global ranking, assigning a position of null to any unranked agenda_items" do
        jump(1.minute)

        4.times do
          user = User.make
          meeting.rankings.create(:user => user, :agenda_item => memphis, :position => 4)
          meeting.rankings.create(:user => user, :agenda_item => nashville, :position => 3)
          meeting.rankings.create(:user => user, :agenda_item => chattanooga, :position => 2)
          meeting.rankings.create(:user => user, :agenda_item => knoxville, :position => 1)
        end

        3.times do
          user = User.make
          meeting.rankings.create(:user => user, :agenda_item => nashville, :position => 4)
          meeting.rankings.create(:user => user, :agenda_item => chattanooga, :position => 3)
          meeting.rankings.create(:user => user, :agenda_item => knoxville, :position => 2)
          meeting.rankings.create(:user => user, :agenda_item => memphis, :position => 1)
        end

        1.times do
          user = User.make
          meeting.rankings.create(:user => user, :agenda_item => chattanooga, :position => 4)
          meeting.rankings.create(:user => user, :agenda_item => knoxville, :position => 3)
          meeting.rankings.create(:user => user, :agenda_item => nashville, :position => 2)
          meeting.rankings.create(:user => user, :agenda_item => memphis, :position => 1)
        end

        2.times do
          user = User.make
          meeting.rankings.create(:user => user, :agenda_item => knoxville, :position => 4)
          meeting.rankings.create(:user => user, :agenda_item => chattanooga, :position => 3)
          meeting.rankings.create(:user => user, :agenda_item => nashville, :position => 2)
          meeting.rankings.create(:user => user, :agenda_item => memphis, :position => 1)
        end

        meeting.compute_global_ranking

        nashville.reload.position.should == 1
        chattanooga.position.should == 2
        knoxville.position.should == 3
        memphis.position.should == 4
        unranked.position.should == 5

        meeting.updated_at.to_i.should == Time.now.to_i
      end
    end

    describe "#users_to_notify_immediately" do
      it "includes members of the team that have their meeting notification preference set to immediately and are not the creator of the meeting" do
        notify1 = User.make
        notify2 = User.make
        dont_notify = User.make

        team.memberships.make(:user => notify1, :notify_of_new_meetings => 'immediately')
        team.memberships.make(:user => notify2, :notify_of_new_meetings => 'immediately')
        team.memberships.make(:user => dont_notify, :notify_of_new_meetings => 'hourly')
        team.memberships.find(:user => creator).update!(:notify_of_new_meetings => 'immediately')

        meeting.users_to_notify_immediately.all.should =~ [notify1, notify2]
      end
    end

    describe "security" do
      attr_reader :team, :member, :owner, :admin, :non_member

      before do
        @team = Team.make
        @member = team.make_member
        @owner = team.make_owner
        @admin = User.make(:admin => true)
        @non_member = User.make
      end

      describe "body length limit" do
        it "raises a security error if trying to create or update with a body longer than 140 chars" do
          long_body = "x" * 145

          expect {
            Meeting.make(:body => long_body)
          }.to raise_error(SecurityError)

          expect {
            Meeting.make.update(:body => long_body)
          }.to raise_error(SecurityError)

          meeting = Meeting.make

          # grandfathered meetings can have other properties updated, but not the body
          Prequel::DB[:meetings].filter(:id => meeting.id).update(:body => long_body)
          meeting.reload

          meeting.update(:details => "Hi") # should work
          expect {
            meeting.update(:body => long_body + "and even longer!!!")
          }.to raise_error(SecurityError)
        end
      end

      describe "#can_create?" do
        before do
          @meeting = team.meetings.make_unsaved
        end

        context "if the meeting's team is non-public" do
          before do
            meeting.team.update(:privacy => "read_only")
          end

          specify "only members create agenda_items" do
            set_current_user(member)
            meeting.can_create?.should be_true

            set_current_user(non_member)
            meeting.can_create?.should be_false
          end
        end

        context "if the given meeting's team is public" do
          before do
            meeting.team.update(:privacy => "public")
          end

          specify "non-guest users can create agenda_items" do
            set_current_user(User.default_guest)
            meeting.can_create?.should be_false

            set_current_user(non_member)
            meeting.can_create?.should be_true
          end
        end
      end

      describe "#can_update? and #can_destroy?" do
        it "only allows admins, team owners, and the creator of the meeting itself to update or destroy it" do
          other_member = set_current_user(User.make)
          team.memberships.create!(:user => other_member)
          meeting = team.meetings.create!(:body => "What should we do?")

          set_current_user(member)
          meeting.can_update?.should be_false
          meeting.can_destroy?.should be_false


          set_current_user(other_member)
          meeting.can_update?.should be_true
          meeting.can_destroy?.should be_true

          set_current_user(owner)
          meeting.can_update?.should be_true
          meeting.can_destroy?.should be_true

          set_current_user(admin)
          meeting.can_update?.should be_true
          meeting.can_destroy?.should be_true
        end
      end
    end
  end
end
