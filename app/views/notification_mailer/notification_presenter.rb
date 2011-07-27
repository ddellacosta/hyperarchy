module Views
  module NotificationMailer
    class NotificationPresenter
      include HeadlineGeneration

      attr_reader :user, :period, :item, :membership_presenters
      attr_accessor :new_meeting_count, :new_agenda_item_count, :new_note_count

      def initialize(user, period, item=nil)
        @user, @period, @item = user, period, item
        if period == "immediately"
          build_immediate_notification
        else
          build_periodic_notification
        end
        gather_counts
      end

      def build_immediate_notification
        membership = item.team.memberships.find(:user => user)
        @membership_presenters = [MembershipPresenter.new(membership, period, item)]
      end

      def build_periodic_notification
        @membership_presenters = user.memberships_to_notify(period).map do |membership|
          presenter = MembershipPresenter.new(membership, period, nil)
          presenter unless presenter.empty?
        end.compact
      end

      def gather_counts
        @new_meeting_count = 0
        @new_agenda_item_count = 0
        @new_note_count = 0

        membership_presenters.each do |presenter|
          self.new_meeting_count += presenter.new_meeting_count
          self.new_agenda_item_count += presenter.new_agenda_item_count
          self.new_note_count += presenter.new_note_count
        end
      end

      def subject
        "#{item_counts} on Actionitems"
      end

      def empty?
        membership_presenters.empty?
      end

      def multiple_memberships?
        membership_presenters.length > 1
      end

      def to_s(template)
        lines = []
        membership_presenters.each do |presenter|
          lines.push(presenter.team.name) if multiple_memberships?
          lines.push("")
          presenter.add_lines(template, lines)
          lines.push("", "", "")
        end
        lines.join("\n")
      end
    end
  end
end

