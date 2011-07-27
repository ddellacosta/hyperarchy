module Views
  module NotificationMailer
    class QuestionPresenter
      attr_reader :question, :question_is_new
      attr_reader :agenda_item_presenters_by_agenda_item
      delegate :score, :to => :question

      def initialize(question, question_is_new)
        @question, @question_is_new = question, question_is_new

        @agenda_item_presenters_by_agenda_item = {}

        # show all agenda_items of a new question
        if question_is_new
          question.agenda_items.each do |agenda_item|
            agenda_item_presenters_by_agenda_item[agenda_item] = AgendaItemPresenter.new(agenda_item, true)
          end
        end
      end

      def add_new_agenda_item(agenda_item)
        return if question_is_new # already have all the agenda_items
        agenda_item_presenters_by_agenda_item[agenda_item] = AgendaItemPresenter.new(agenda_item, true)
      end

      def add_new_comment(comment)
        agenda_item = comment.agenda_item
        build_agenda_item_presenter_if_needed(agenda_item)
        agenda_item_presenters_by_agenda_item[agenda_item].add_new_comment(comment)
      end

      def build_agenda_item_presenter_if_needed(agenda_item)
        return if question_is_new || agenda_item_presenters_by_agenda_item.has_key?(agenda_item)
        agenda_item_presenters_by_agenda_item[agenda_item] = AgendaItemPresenter.new(agenda_item, false)
      end

      def agenda_item_presenters
        agenda_item_presenters_by_agenda_item.values.sort_by(&:position)
      end

      def add_lines(template, lines)
        lines.push("Question:")
        lines.push("#{question.body} -- #{question.creator.full_name}")
        lines.push("view at: #{template.question_url(question)}")
        lines.push("")
        agenda_item_presenters.each do |presenter|
          presenter.add_lines(template, lines)
        end
        lines.push("--------------------", "")
      end
    end
  end
end
