require 'spec_helper'

module Models
  describe Question do
    attr_reader :question, :team, :creator, :memphis, :knoxville, :chattanooga, :nashville, :unranked

    before do
      freeze_time

      @team = Team.make
      @creator = team.make_member
      @question = team.questions.make(:body => "Where should the capital of Tennesee be?", :creator => creator)
      @memphis = question.agenda_items.make(:body => "Memphis")
      @knoxville = question.agenda_items.make(:body => "Knoxville")
      @chattanooga = question.agenda_items.make(:body => "Chattanooga")
      @nashville = question.agenda_items.make(:body => "Nashville")
      @unranked = question.agenda_items.make(:body => "Unranked")
    end


    describe ".update_scores" do
      it "causes scores to go down as time passes" do
        initial_score = question.score

        question.update(:created_at => 1.hour.ago)
        Question.update_scores
        
        question.reload.score.should be < initial_score
      end

      it "causes scores to go up as votes are added" do
        initial_score = question.score

        question.update(:vote_count => 10)
        Question.update_scores
        
        question.reload.score.should be > initial_score
      end
    end

    describe "before create" do
      it "if the creator is not a member of the question's team, makes them one (as long as the org is public)" do
        set_current_user(User.make)
        current_user.memberships.where(:team => team).should be_empty

        team.update(:privacy => "private")
        expect do
          team.questions.create!(:body => "foo")
        end.should raise_error(SecurityError)

        team.update(:privacy => "public")
        team.questions.create!(:body => "foo")

        current_user.memberships.where(:team => team).size.should == 1
      end

      it "assigns the creator to the Model::Record.current_user" do
        set_current_user(User.make)
        question = Question.make
        question.creator.should == current_user
      end

      it "assigns a score" do
        question.score.should_not be_nil
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

        team.memberships.make(:user => creator, :notify_of_new_questions => "immediately")
        team.memberships.make(:user => opted_in, :notify_of_new_questions => "immediately")
        team.memberships.make(:user => opted_out, :notify_of_new_questions => "never")

        set_current_user(creator)
      end

      it "enqueues a SendImmediateNotification job with the question" do
        job_params = nil
        mock(Jobs::SendImmediateNotifications).create(is_a(Hash)) do |params|
          job_params = params
        end
        
        question = team.questions.create!(:body => "What should we eat for dinner?")
        job_params.should ==  { :class_name => "Question", :id => question.id }
      end

      it "increments the question count on its team" do
        lambda do
          team.questions.create!(:body => "What should we eat for dinner?")
        end.should change { team.question_count }.by(1)
      end
    end

    describe "before update" do
      it "updates the score if the vote count changed" do
        score_before = question.score
        question.vote_count += 1
        question.save
        question.score.should be > score_before
      end
    end

    describe "before destroy" do
      it "destroys any agenda_items, agenda_item notes, votes and visits that belong to the question" do
        question = Question.make
        user_1 = question.team.make_member
        user_2 = question.team.make_member
        agenda_item_1 = question.agenda_items.make
        agenda_item_2 = question.agenda_items.make
        agenda_item_1.notes.make
        agenda_item_2.notes.make

        Ranking.create!(:user => user_1, :agenda_item => agenda_item_1, :position => 64)
        Ranking.create!(:user => user_1, :agenda_item => agenda_item_2, :position => 32)
        Ranking.create!(:user => user_2, :agenda_item => agenda_item_1, :position => 64)
        question.question_visits.create!(:user => user_1)

        question.question_visits.size.should == 1
        question.agenda_items.size.should == 2
        question.votes.size.should == 2
        question.agenda_items.join_through(AgendaItemNote).size.should == 2
        question.destroy
        question.agenda_items.should be_empty
        question.votes.should be_empty
        question.question_visits.should be_empty
        question.agenda_items.join_through(AgendaItemNote).should be_empty
      end
    end

    describe "after destroy" do
      it "decrements the question count on its team" do
        question = Question.make
        lambda do
          question.destroy
        end.should change { question.team.question_count }.by(-1)
      end
    end

    describe "#compute_global_ranking" do
      it "uses the ranked-pairs algoritm to produce a global ranking, assigning a position of null to any unranked agenda_items" do
        jump(1.minute)

        4.times do
          user = User.make
          question.rankings.create(:user => user, :agenda_item => memphis, :position => 4)
          question.rankings.create(:user => user, :agenda_item => nashville, :position => 3)
          question.rankings.create(:user => user, :agenda_item => chattanooga, :position => 2)
          question.rankings.create(:user => user, :agenda_item => knoxville, :position => 1)
        end

        3.times do
          user = User.make
          question.rankings.create(:user => user, :agenda_item => nashville, :position => 4)
          question.rankings.create(:user => user, :agenda_item => chattanooga, :position => 3)
          question.rankings.create(:user => user, :agenda_item => knoxville, :position => 2)
          question.rankings.create(:user => user, :agenda_item => memphis, :position => 1)
        end

        1.times do
          user = User.make
          question.rankings.create(:user => user, :agenda_item => chattanooga, :position => 4)
          question.rankings.create(:user => user, :agenda_item => knoxville, :position => 3)
          question.rankings.create(:user => user, :agenda_item => nashville, :position => 2)
          question.rankings.create(:user => user, :agenda_item => memphis, :position => 1)
        end

        2.times do
          user = User.make
          question.rankings.create(:user => user, :agenda_item => knoxville, :position => 4)
          question.rankings.create(:user => user, :agenda_item => chattanooga, :position => 3)
          question.rankings.create(:user => user, :agenda_item => nashville, :position => 2)
          question.rankings.create(:user => user, :agenda_item => memphis, :position => 1)
        end

        question.compute_global_ranking

        nashville.reload.position.should == 1
        chattanooga.position.should == 2
        knoxville.position.should == 3
        memphis.position.should == 4
        unranked.position.should == 5

        question.updated_at.to_i.should == Time.now.to_i
      end
    end

    describe "#users_to_notify_immediately" do
      it "includes members of the team that have their question notification preference set to immediately and are not the creator of the question" do
        notify1 = User.make
        notify2 = User.make
        dont_notify = User.make

        team.memberships.make(:user => notify1, :notify_of_new_questions => 'immediately')
        team.memberships.make(:user => notify2, :notify_of_new_questions => 'immediately')
        team.memberships.make(:user => dont_notify, :notify_of_new_questions => 'hourly')
        team.memberships.find(:user => creator).update!(:notify_of_new_questions => 'immediately')

        question.users_to_notify_immediately.all.should =~ [notify1, notify2]
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
            Question.make(:body => long_body)
          }.to raise_error(SecurityError)

          expect {
            Question.make.update(:body => long_body)
          }.to raise_error(SecurityError)

          question = Question.make

          # grandfathered questions can have other properties updated, but not the body
          Prequel::DB[:questions].filter(:id => question.id).update(:body => long_body)
          question.reload

          question.update(:details => "Hi") # should work
          expect {
            question.update(:body => long_body + "and even longer!!!")
          }.to raise_error(SecurityError)
        end
      end

      describe "#can_create?" do
        before do
          @question = team.questions.make_unsaved
        end

        context "if the question's team is non-public" do
          before do
            question.team.update(:privacy => "read_only")
          end

          specify "only members create agenda_items" do
            set_current_user(member)
            question.can_create?.should be_true

            set_current_user(non_member)
            question.can_create?.should be_false
          end
        end

        context "if the given question's team is public" do
          before do
            question.team.update(:privacy => "public")
          end

          specify "non-guest users can create agenda_items" do
            set_current_user(User.default_guest)
            question.can_create?.should be_false

            set_current_user(non_member)
            question.can_create?.should be_true
          end
        end
      end

      describe "#can_update? and #can_destroy?" do
        it "only allows admins, team owners, and the creator of the question itself to update or destroy it" do
          other_member = set_current_user(User.make)
          team.memberships.create!(:user => other_member)
          question = team.questions.create!(:body => "What should we do?")

          set_current_user(member)
          question.can_update?.should be_false
          question.can_destroy?.should be_false


          set_current_user(other_member)
          question.can_update?.should be_true
          question.can_destroy?.should be_true

          set_current_user(owner)
          question.can_update?.should be_true
          question.can_destroy?.should be_true

          set_current_user(admin)
          question.can_update?.should be_true
          question.can_destroy?.should be_true
        end
      end
    end
  end
end
