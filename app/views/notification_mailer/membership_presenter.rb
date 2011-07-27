module Views
  module NotificationMailer
    class MembershipPresenter
      include HeadlineGeneration

      attr_reader :membership, :period, :item
      attr_reader :meeting_presenters_by_meeting, :agenda_item_presenters_by_agenda_item
      attr_accessor :new_meeting_count, :new_agenda_item_count, :new_note_count
      delegate :team, :to => :membership

      def initialize(membership, period, item)
        @membership, @period, @item = membership, period, item
        @meeting_presenters_by_meeting = {}
        @agenda_item_presenters_by_agenda_item = {}
        @new_meeting_count = 0
        @new_agenda_item_count = 0
        @new_note_count = 0

        if period == "immediately"
          build_immediate_notification
        else
          build_periodic_notification
        end
      end

      def build_immediate_notification
        case item
          when Meeting
            add_new_meeting(item)
          when AgendaItem
            add_new_agenda_item(item)
          when AgendaItemNote
            add_new_note(item)
          else
            raise "No notification mechanism implemented for item: #{item.inspect}"
        end
      end

      def build_periodic_notification
        if membership.wants_meeting_notifications?(period)
          membership.new_meetings_in_period(period).each do |meeting|
            add_new_meeting(meeting)
          end
        end

        if membership.wants_agenda_item_notifications?(period)
          membership.new_agenda_items_in_period(period).each do |agenda_item|
            add_new_agenda_item(agenda_item)
          end
        end

        if membership.wants_own_agenda_item_note_notifications?(period)
          membership.new_notes_on_own_agenda_items_in_period(period).each do |note|
            add_new_note(note)
          end
        end

        if membership.wants_ranked_agenda_item_note_notifications?(period)
          membership.new_notes_on_ranked_agenda_items_in_period(period).each do |note|
            add_new_note(note)
          end
        end
      end

      def add_new_meeting(meeting)
        self.new_meeting_count += 1
        meeting_presenters_by_meeting[meeting] = MeetingPresenter.new(meeting, true)
      end

      def add_new_agenda_item(agenda_item)
        self.new_agenda_item_count += 1
        meeting = agenda_item.meeting
        build_meeting_presenter_if_needed(meeting)
        meeting_presenters_by_meeting[meeting].add_new_agenda_item(agenda_item)
      end

      def add_new_note(note)
        self.new_note_count += 1
        meeting = note.meeting
        build_meeting_presenter_if_needed(meeting)
        meeting_presenters_by_meeting[meeting].add_new_note(note)
      end

      def build_meeting_presenter_if_needed(meeting)
        return if meeting_presenters_by_meeting.has_key?(meeting)
        meeting_presenters_by_meeting[meeting] = MeetingPresenter.new(meeting, false)
      end

      def meeting_presenters
        meeting_presenters_by_meeting.values.sort_by(&:score).reverse!
      end

      def headline
        "#{item_counts}:"
      end

      def empty?
        new_meeting_count == 0 && new_agenda_item_count == 0 && new_note_count == 0
      end

      def add_lines(template, lines)
        lines.push(headline, "")

        meeting_presenters.each do |presenter|
          presenter.add_lines(template, lines)
        end
      end
    end
  end
end
