module Views
  module NotificationMailer
    class AgendaItemPresenter
      attr_reader :agenda_item, :agenda_item_is_new, :new_comments
      delegate :position, :to => :agenda_item

      def initialize(agenda_item, agenda_item_is_new)
        @agenda_item, @agenda_item_is_new = agenda_item, agenda_item_is_new
        @new_comments = []
      end

      def add_new_comment(comment)
        new_comments.push(comment)
      end

      def add_lines(template, lines)
        lines.push("AgendaItem:")
        lines.push(agenda_item.body)
        lines.push("suggested by #{agenda_item.creator.full_name}")
        lines.push("")
        lines.push("Comments:") unless new_comments.empty?
        new_comments.each do |comment|
          lines.push("#{comment.body} -- #{agenda_item.creator.full_name}", "")
        end
        lines.push("")
      end
    end
  end
end
