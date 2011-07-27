module Views
  module NotificationMailer
    class MeetingPresenter
      attr_reader :meeting, :meeting_is_new
      attr_reader :agenda_item_presenters_by_agenda_item
      delegate :score, :to => :meeting

      def initialize(meeting, meeting_is_new)
        @meeting, @meeting_is_new = meeting, meeting_is_new

        @agenda_item_presenters_by_agenda_item = {}

        # show all agenda_items of a new meeting
        if meeting_is_new
          meeting.agenda_items.each do |agenda_item|
            agenda_item_presenters_by_agenda_item[agenda_item] = AgendaItemPresenter.new(agenda_item, true)
          end
        end
      end

      def add_new_agenda_item(agenda_item)
        return if meeting_is_new # already have all the agenda_items
        agenda_item_presenters_by_agenda_item[agenda_item] = AgendaItemPresenter.new(agenda_item, true)
      end

      def add_new_note(note)
        agenda_item = note.agenda_item
        build_agenda_item_presenter_if_needed(agenda_item)
        agenda_item_presenters_by_agenda_item[agenda_item].add_new_note(note)
      end

      def build_agenda_item_presenter_if_needed(agenda_item)
        return if meeting_is_new || agenda_item_presenters_by_agenda_item.has_key?(agenda_item)
        agenda_item_presenters_by_agenda_item[agenda_item] = AgendaItemPresenter.new(agenda_item, false)
      end

      def agenda_item_presenters
        agenda_item_presenters_by_agenda_item.values.sort_by(&:position)
      end

      def add_lines(template, lines)
        lines.push("Meeting:")
        lines.push("#{meeting.body} -- #{meeting.creator.full_name}")
        lines.push("view at: #{template.meeting_url(meeting)}")
        lines.push("")
        agenda_item_presenters.each do |presenter|
          presenter.add_lines(template, lines)
        end
        lines.push("--------------------", "")
      end
    end
  end
end
