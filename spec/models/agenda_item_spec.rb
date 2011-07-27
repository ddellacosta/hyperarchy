require 'spec_helper'

module Models
  describe AgendaItem do
    attr_reader :question, :team, :creator, :agenda_item
    before do
      @question = Question.make
      @team = question.team
      @creator = team.make_member
      set_current_user(creator)
      @agenda_item = question.agenda_items.make
    end

    describe "life-cycle hooks" do
      before do
        AgendaItem.clear
      end

      describe "before create" do
        it "assigns the creator to the Model::Record.current_user" do
          set_current_user(User.make)
          question.team.memberships.make(:user => current_user)

          agenda_item = question.agenda_items.create(:body => "foo")
          agenda_item.creator.should == current_user
        end

        it "if the creator is not a member of the team, makes them one (as long as the org is public)" do
          set_current_user(User.make)
          current_user.memberships.where(:team => team).should be_empty

          team.update(:privacy => "private")
          expect do
            question.agenda_items.create(:body => "foo")
          end.should raise_error(SecurityError)

          team.update(:privacy => "public")
          agenda_item = question.agenda_items.create(:body => "foo")

          current_user.memberships.where(:team => team).size.should == 1
        end
      end

      describe "after create" do
        def verify_majority(winner, loser, question)
          majority = Majority.find(:winner => winner, :loser => loser, :question => question)
          majority.should_not be_nil
          majority.winner_created_at.to_i.should == winner.created_at.to_i
        end

        it "creates a winning and losing majority every pairing of the created agenda_item with other agenda_items" do
          question.agenda_items.should be_empty

          falafel = question.agenda_items.make(:body => "Falafel")
          tacos = question.agenda_items.make(:body => "Tacos")

          verify_majority(falafel, tacos, question)
          verify_majority(tacos, falafel, question)

          fish = question.agenda_items.make(:body => "Fish")

          verify_majority(falafel, fish, question)
          verify_majority(tacos, fish, question)
          verify_majority(fish, falafel, question)
          verify_majority(fish, tacos, question)
        end

        it "makes the new agenda_item lose to every positively ranked agenda_item and win over every negatively ranked one, then recomputes the question results" do
          user_1 = User.make
          user_2 = User.make
          user_3 = User.make

          _3_up_0_down = question.agenda_items.make(:body => "3 Up - 0 Down")
          _2_up_1_down = question.agenda_items.make(:body => "2 Up - 1 Down")
          _1_up_2_down = question.agenda_items.make(:body => "1 Up - 2 Down")
          _0_up_3_down = question.agenda_items.make(:body => "0 Up - 3 Down")
          unranked     = question.agenda_items.make(:body => "Unranked")

          question.rankings.create(:user => user_1, :agenda_item => _3_up_0_down, :position => 64)
          question.rankings.create(:user => user_1, :agenda_item => _2_up_1_down, :position => 32)
          question.rankings.create(:user => user_1, :agenda_item => _1_up_2_down, :position => 16)
          question.rankings.create(:user => user_1, :agenda_item => _0_up_3_down, :position => -64)

          question.rankings.create(:user => user_2, :agenda_item => _3_up_0_down, :position => 64)
          question.rankings.create(:user => user_2, :agenda_item => _2_up_1_down, :position => 32)
          question.rankings.create(:user => user_2, :agenda_item => _1_up_2_down, :position => -32)
          question.rankings.create(:user => user_2, :agenda_item => _0_up_3_down, :position => -64)

          question.rankings.create(:user => user_3, :agenda_item => _3_up_0_down, :position => 64)
          question.rankings.create(:user => user_3, :agenda_item => _2_up_1_down, :position => -16)
          question.rankings.create(:user => user_3, :agenda_item => _1_up_2_down, :position => -32)
          question.rankings.create(:user => user_3, :agenda_item => _0_up_3_down, :position => -64)

          mock.proxy(question).compute_global_ranking
          agenda_item = question.agenda_items.make(:body => "Alpaca")
          # new agenda_item is tied with 'Unranked' so could go either before it or after it
          # until we handle ties, but it should be less than the negatively ranked agenda_items
          agenda_item.position.should be < 5

          find_majority(_3_up_0_down, agenda_item).pro_count.should == 3
          find_majority(_3_up_0_down, agenda_item).con_count.should == 0
          find_majority(agenda_item, _3_up_0_down).pro_count.should == 0
          find_majority(agenda_item, _3_up_0_down).con_count.should == 3

          find_majority(_2_up_1_down, agenda_item).pro_count.should == 2
          find_majority(_2_up_1_down, agenda_item).con_count.should == 1
          find_majority(agenda_item, _2_up_1_down).pro_count.should == 1
          find_majority(agenda_item, _2_up_1_down).con_count.should == 2

          find_majority(_1_up_2_down, agenda_item).pro_count.should == 1
          find_majority(_1_up_2_down, agenda_item).con_count.should == 2
          find_majority(agenda_item, _1_up_2_down).pro_count.should == 2
          find_majority(agenda_item, _1_up_2_down).con_count.should == 1

          find_majority(_0_up_3_down, agenda_item).pro_count.should == 0
          find_majority(_0_up_3_down, agenda_item).con_count.should == 3
          find_majority(agenda_item, _0_up_3_down).pro_count.should == 3
          find_majority(agenda_item, _0_up_3_down).con_count.should == 0

          find_majority(unranked, agenda_item).pro_count.should == 0
          find_majority(unranked, agenda_item).con_count.should == 0
          find_majority(agenda_item, unranked).pro_count.should == 0
          find_majority(agenda_item, unranked).con_count.should == 0
        end

        it "gives the agenda_item a position of 1 if they are the only agenda_item" do
          agenda_item = question.agenda_items.make(:body => "Only")
          question.agenda_items.size.should == 1
          agenda_item.position.should == 1
        end

        it "enqueues a SendImmediateNotification job with the agenda_item" do
          job_params = nil
          mock(Jobs::SendImmediateNotifications).create(is_a(Hash)) do |params|
            job_params = params
          end

          agenda_item = question.agenda_items.create!(:body => "Turkey.")
          job_params.should ==  { :class_name => "AgendaItem", :id => agenda_item.id }
        end
      end

      describe "#before_destroy" do
        it "destroys any rankings, notes, and majorities associated with the agenda_item, but does not change the updated_at time of associated votes" do
          user_1 = User.make
          user_2 = User.make

          agenda_item_1 = question.agenda_items.make(:body => "foo")
          agenda_item_2 = question.agenda_items.make(:body => "bar")
          note_1 = agenda_item_1.notes.make
          note_2 = agenda_item_1.notes.make

          freeze_time
          voting_time = Time.now

          question.rankings.create(:user => user_1, :agenda_item => agenda_item_1, :position => 64)
          question.rankings.create(:user => user_1, :agenda_item => agenda_item_2, :position => 32)
          question.rankings.create(:user => user_2, :agenda_item => agenda_item_1, :position => 32)

          Ranking.where(:agenda_item_id => agenda_item_1.id).size.should == 2
          Majority.where(:winner_id => agenda_item_1.id).size.should == 1
          Majority.where(:loser_id => agenda_item_1.id).size.should == 1
          AgendaItemNote.where(:agenda_item_id => agenda_item_1.id).size.should == 2

          question.votes.size.should == 2
          question.votes.each do |vote|
            vote.updated_at.should == Time.now
          end

          jump(1.minute)

          agenda_item_1.destroy

          Ranking.where(:agenda_item_id => agenda_item_1.id).should be_empty
          Majority.where(:winner_id => agenda_item_1.id).should be_empty
          Majority.where(:loser_id => agenda_item_1.id).should be_empty
          AgendaItemNote.where(:agenda_item_id => agenda_item_1.id).should be_empty

          question.votes.size.should == 1
          question.votes.first.updated_at.should == voting_time
        end
      end
    end

    describe "#users_to_notify_immediately" do
      it "returns the members of the agenda_item's team who have their agenda_item notifaction preference set to 'immediately' " +
          "and who voted on the agenda_item's question and who did not create the agenda_item" do
        notify1 = User.make
        notify2 = User.make
        dont_notify1 = User.make
        dont_notify2 = User.make

        notify1.votes.create!(:question => question)
        notify2.votes.create!(:question => question)
        dont_notify1.votes.create!(:question => question)
        creator.votes.create!(:question => question)

        team.memberships.make(:user => notify1, :notify_of_new_agenda_items => 'immediately')
        team.memberships.make(:user => notify2, :notify_of_new_agenda_items => 'immediately')
        team.memberships.make(:user => dont_notify1, :notify_of_new_agenda_items => 'hourly')
        team.memberships.make(:user => dont_notify2, :notify_of_new_agenda_items => 'immediately')
        team.memberships.find(:user => creator).update!(:notify_of_new_agenda_items => 'immediately')

        agenda_item.users_to_notify_immediately.all.should =~ [notify1, notify2]
      end
    end

    describe "#extra_records_for_create_events" do
      it "contains the agenda_item's creator" do
        agenda_item.extra_records_for_create_events.should == [creator]
      end
    end

    describe "security" do
      attr_reader :member, :owner, :non_member, :membership, :agenda_item

      before do
        @member = question.team.make_member
        @owner = question.team.make_owner
        @non_member = User.make
        @membership = question.team.memberships.make(:user => member)
        @agenda_item = question.agenda_items.make(:body => "Hey you!")
      end

      describe "body length limit" do
        it "raises a security error if trying to create or update with a body longer than 140 chars" do
          long_body = "x" * 145

          expect {
            AgendaItem.make(:body => long_body)
          }.to raise_error(SecurityError)

          expect {
            AgendaItem.make.update(:body => long_body)
          }.to raise_error(SecurityError)

          agenda_item = AgendaItem.make

          # grandfathered agenda_items can have other properties updated, but not the body
          Prequel::DB[:agenda_items].filter(:id => agenda_item.id).update(:body => long_body)
          agenda_item.reload

          agenda_item.update(:details => "Hi") # should work
          expect {
            agenda_item.update(:body => long_body + "and even longer!!!")
          }.to raise_error(SecurityError)
        end
      end

      describe "#can_create?" do
        before do
          question.team.update(:privacy => "read_only")
        end

        context "if the given question's team is non-public" do
          specify "only members create agenda_items" do
            set_current_user(member)
            question.agenda_items.make_unsaved.can_create?.should be_true

            set_current_user(non_member)
            question.agenda_items.make_unsaved.can_create?.should be_false
          end
        end

        context "if the given question's team is public" do
          before do
            question.team.update(:privacy => "public")
          end

          specify "non-guest users can create agenda_items" do
            set_current_user(User.default_guest)
            question.agenda_items.make_unsaved.can_create?.should be_false

            set_current_user(non_member)
            question.agenda_items.make_unsaved.can_create?.should be_true
          end
        end
      end

      describe "#can_update? and #can_destroy?" do
        specify "only admins, team owners, and the agenda_item creator can destroy it or update its body and details" do
          set_current_user(non_member)
          agenda_item.can_update?.should be_false
          agenda_item.can_destroy?.should be_false

          non_member.update!(:admin => true)
          agenda_item.can_update?.should be_true
          agenda_item.can_destroy?.should be_true

          set_current_user(member)
          agenda_item.can_update?.should be_false
          agenda_item.can_destroy?.should be_false

          set_current_user(owner)
          agenda_item.can_update?.should be_true
          agenda_item.can_destroy?.should be_true

          set_current_user(member)
          agenda_item.update!(:creator_id => member.id)
          agenda_item.can_update?.should be_true
          agenda_item.can_destroy?.should be_true

          # no one can update properties other than body and details
          agenda_item.can_update_columns?([:question_id, :creator_id, :position]).should be_false
        end
      end
    end
  end
end
