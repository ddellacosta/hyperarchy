require 'spec_helper'

module Views
  module NotificationMailer
    describe MembershipPresenter do

      let :membership do
        Membership.make(
          :notify_of_new_meetings => new_meetings,
          :notify_of_new_agenda_items => new_agenda_items,
          :notify_of_new_notes_on_own_agenda_items => new_notes_on_own_agenda_items,
          :notify_of_new_notes_on_ranked_agenda_items => new_notes_on_ranked_agenda_items
        )
      end

      let(:new_meetings) { 'hourly' }
      let(:new_agenda_items) { 'hourly' }
      let(:new_notes_on_own_agenda_items) { 'hourly' }
      let(:new_notes_on_ranked_agenda_items) { 'hourly' }

      before do
        stub(membership) do |m|
          m.new_meetings_in_period('hourly') { [] }
          m.new_agenda_items_in_period('hourly') { [] }
          m.new_notes_on_ranked_agenda_items_in_period('hourly') { [] }
          m.new_notes_on_own_agenda_items_in_period('hourly') { [] }
        end
      end

      describe "when the user elects not to receive new meeting notifications for this period" do
        let(:new_meetings) { 'weekly' }

        it "does not query them from the membership" do
          dont_allow(membership).new_meetings_in_period
          MembershipPresenter.new(membership, 'hourly', nil)
        end
      end

      describe "when the user elects not to receive new agenda_item notifications for this period" do
        let(:new_agenda_items) { 'never' }

        it "does not query them from the membership" do
          dont_allow(membership).new_agenda_items_in_period
          MembershipPresenter.new(membership, 'hourly', nil)
        end
      end

      describe "when the user elects not to receive new note notifications on their own agenda_items for this period" do
        let(:new_notes_on_own_agenda_items) { 'immediately' }

        it "does not query them from the membership" do
          dont_allow(membership).new_notes_on_own_agenda_items_in_period
          MembershipPresenter.new(membership, 'hourly', nil)
        end
      end

      describe "when the user elects not to receive new note notifications on agenda_items they have ranked for this period" do
        let(:new_notes_on_ranked_agenda_items) { 'daily' }

        it "does not query them from the membership" do
          dont_allow(membership).new_notes_on_ranked_agenda_items_in_period
          MembershipPresenter.new(membership, 'hourly', nil)
        end
      end

      describe "when the user elects to receive all notifications" do
        it "calls all the methods we expect on membership to report results (these methods are unit tested individually)" do
          mock(membership) do |m|
            m.new_meetings_in_period('hourly') { [] }
            m.new_agenda_items_in_period('hourly') { [] }
            m.new_notes_on_ranked_agenda_items_in_period('hourly') { [] }
            m.new_notes_on_own_agenda_items_in_period('hourly') { [] }
          end
          MembershipPresenter.new(membership, 'hourly', nil)
        end
      end
    end
  end
end