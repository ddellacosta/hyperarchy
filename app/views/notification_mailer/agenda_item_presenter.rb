module Views
  module NotificationMailer
    class AgendaItemPresenter
      attr_reader :agenda_item, :agenda_item_is_new, :new_notes
      delegate :position, :to => :agenda_item

      def initialize(agenda_item, agenda_item_is_new)
        @agenda_item, @agenda_item_is_new = agenda_item, agenda_item_is_new
        @new_notes = []
      end

      def add_new_note(note)
        new_notes.push(note)
      end

      def add_lines(template, lines)
        lines.push("AgendaItem:")
        lines.push(agenda_item.body)
        lines.push("suggested by #{agenda_item.creator.full_name}")
        lines.push("")
        lines.push("Notes:") unless new_notes.empty?
        new_notes.each do |note|
          lines.push("#{note.body} -- #{agenda_item.creator.full_name}", "")
        end
        lines.push("")
      end
    end
  end
end
