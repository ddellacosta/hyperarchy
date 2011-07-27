require 'spec_helper'

describe Ranking do
  describe "after create, update, or destroy" do
    attr_reader :user, :question, :agenda_item_1, :agenda_item_2, :agenda_item_3

    before do
      @user = User.make
      @question = Question.make
      @agenda_item_1 = question.agenda_items.make(:body => "1")
      @agenda_item_2 = question.agenda_items.make(:body => "2")
      @agenda_item_3 = question.agenda_items.make(:body => "3")
    end

    specify "majorities are updated accordingly and #compute_global_ranking is called on the ranking's question" do
      question.majorities.each do |majority|
        majority.pro_count.should == 0
      end

      # 1, (2, 3)
      mock.proxy(question).compute_global_ranking
      ranking_1 = question.rankings.create(:user => user, :agenda_item => agenda_item_1, :position => 64)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 1

      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 1

      # 1, 2, (3)
      mock.proxy(question).compute_global_ranking
      ranking_2 = question.rankings.create(:user => user, :agenda_item => agenda_item_2, :position => 32)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 1

      # 1, 3, 2
      mock.proxy(question).compute_global_ranking
      ranking_3 = question.rankings.create(:user => user, :agenda_item => agenda_item_3, :position => 48)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 0

      # 1, 2, 3
      mock.proxy(question).compute_global_ranking
      ranking_2.update(:position => 56)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 1

      # 2, 1, 3
      mock.proxy(question).compute_global_ranking
      ranking_1.update(:position => 52)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 1

      # 3, 2, 1
      mock.proxy(question).compute_global_ranking
      ranking_3.update(:position => 128)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 0

      # 3, 1, (2)
      mock.proxy(question).compute_global_ranking
      ranking_2.destroy
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 0

      # 1, (2, 3)
      mock.proxy(question).compute_global_ranking
      ranking_3.destroy
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 1
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 0

      mock.proxy(question).compute_global_ranking

      ranking_1.destroy

      question.majorities.each do |majority|
        majority.reload
        majority.pro_count.should == 0
        majority.con_count.should == 0
      end
    end

    specify "negatively ranked agenda_items are counted as losing to unranked agenda_items" do
      question.majorities.each do |majority|
        majority.pro_count.should == 0
      end

      # (2, 3), 1
      mock.proxy(question).compute_global_ranking
      ranking_1 = question.rankings.create(:user => user, :agenda_item => agenda_item_1, :position => -64)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_2).con_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).con_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).con_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).con_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).con_count.should == 0

      # (3), 1, 2
      mock.proxy(question).compute_global_ranking
      ranking_2 = question.rankings.create(:user => user, :agenda_item => agenda_item_2, :position => -128)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1

      # (3), 2, 1
      mock.proxy(question).compute_global_ranking
      ranking_2.update(:position => -32)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1

      # 1, (3), 2
      mock.proxy(question).compute_global_ranking
      ranking_1.update(:position => 64)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0

      # (3), 1, 2
      mock.proxy(question).compute_global_ranking
      ranking_1.update(:position => -16)
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 1
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1

      # (3, 2), 1
      mock.proxy(question).compute_global_ranking
      ranking_2.destroy
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 1
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 1

      # (1, 2, 3) -- all unranked
      mock.proxy(question).compute_global_ranking
      ranking_1.destroy
      find_majority(agenda_item_1, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_1, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_1).pro_count.should == 0
      find_majority(agenda_item_2, agenda_item_3).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_2).pro_count.should == 0
      find_majority(agenda_item_3, agenda_item_1).pro_count.should == 0
    end

    specify "it creates, updates, or destroys the associated vote as appropriate" do
      freeze_time
      users_votes = question.votes.where(:user => user)

      users_votes.should be_empty

      ranking_1 = question.rankings.create(:user => user, :agenda_item => agenda_item_1, :position => 64)

      users_votes.size.should == 1
      vote = question.votes.find(:user => user)
      ranking_1.vote.should == vote
      vote.created_at.should == Time.now
      vote.updated_at.should == Time.now

      jump(1.minute)

      ranking_2 = question.rankings.create(:user => user, :agenda_item => agenda_item_2, :position => 32)
      users_votes.size.should == 1
      ranking_2.vote.should == vote
      vote.updated_at.should == Time.now

      jump(1.minute)

      ranking_1.update(:position => 16)
      users_votes.size.should == 1
      vote.updated_at.should == Time.now

      jump(1.minute)

      ranking_2.destroy
      users_votes.size.should == 1
      vote.updated_at.should == Time.now

      ranking_1.destroy
      users_votes.should be_empty
    end
  end

  describe "security" do
    attr_reader :creator, :other_member, :ranking, :agenda_item
    before do
      question = Question.make
      @agenda_item = question.agenda_items.make
      @creator = agenda_item.question.organization.make_member
      @other_member = agenda_item.question.organization.make_member
      @ranking = Ranking.create!(:user => creator, :agenda_item => agenda_item, :position => 64)
    end

    describe "#can_create? and #can_update?" do
      it "does not allow anyone to create or update, because that is done through a custom action" do
        new_ranking = Ranking.new(:user => creator, :agenda_item => agenda_item, :position => 64)

        set_current_user(other_member)
        new_ranking.can_create?.should be_false
        ranking.can_update?.should be_false

        set_current_user(creator)
        new_ranking.can_create?.should be_false
        ranking.can_update?.should be_false
      end
    end

    describe "#can_destroy?" do
      it "only allows the user who created the ranking to destroy it" do
        set_current_user(other_member)
        ranking.can_destroy?.should be_false

        set_current_user(creator)
        ranking.can_destroy?.should be_true
      end
    end
  end
end