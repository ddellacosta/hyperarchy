module Hyperarchy
  module Emails
    class Notification < Erector::Widget
      attr_reader :notification_presenter

      def content
        html do
          body do
            div :style => "font-size: 14px; font-family: 'Helvetica Neue', Arial, 'Liberation Sans', FreeSans, sans-serif;"  do
              notification_presenter.membership_presenters.each do |membership_presenter|
                membership_section(membership_presenter)
              end
              div :style => "margin: 20px 0; width: 550px;" do
                rawtext "To change the frequency of these notifications or unsubscribe entirely, "
                a "visit your account preferences page", :href => "https://#{HTTP_HOST}/#view=account", :style => "color: #000094; white-space: nowrap;"
                text "."
              end
            end
          end
        end
      end

      def membership_section(presenter)
        if num_membership_presenters > 1
          h1 "#{presenter.organization.name}", :style => "font-size: 22px;"
        end
        h2   presenter.headline
        div :style => "max-width: 500px;" do
          presenter.election_presenters.each do |election_presenter|
            election_section(election_presenter)
          end
        end
      end


      def election_section(presenter)
        election = presenter.election

        color = presenter.election_is_new ? "black" : "#888"

        div :style => "border: 2px solid #ccc; margin-bottom: 10px; padding: 8px; background: #ddd;" do
          a "View Question", :href => election.full_url, :style => "float: right; padding: 5px 15px; background: #f3f3f3; margin-left: 10px; color: #000094; border: 2px solid #ccc;"
          div election.body, :style => "padding: 0px; padding-top: 5px;"
          div :style => "clear: both;"

          unless presenter.candidate_presenters.empty?
            div "Answers:", :style => "color: #888; font-weight: bold; margin: 8px 0;"
            div :style => "border: 2px solid #ccc; max-height: 400px; overflow-y: auto; margin: 8px 0; background: #f3f3f3;" do
              presenter.candidate_presenters.each do |candidate_presenter|
                candidate_section(candidate_presenter)
              end
            end
          end

          unless presenter.new_comments.empty?
            div "Comments:", :style => "color: #888; font-weight: bold; margin: 8px 0;"
            div :style => "border: 2px solid #ccc; max-height: 400px; overflow-y: auto; background: #f3f3f3;" do
              presenter.new_comments.each do |comment|
                comment_section(comment)
              end
            end
          end

        end
      end

      def candidate_section(presenter)
        candidate = presenter.candidate
        color = presenter.candidate_is_new ? "black" : "#888"

        div :style => "border-bottom: 1px solid #ccc; padding: 8px; padding-bottom: 0;" do
          div candidate.body, :style => "float: left; margin-bottom: 8px;"
          div raw("&mdash;#{candidate.creator.full_name}"), :style => "white-space: nowrap; float: right; font-style: italic; color: #777; margin-bottom: 8px;"
          div :style => "clear: both;"

          unless presenter.new_comments.empty?
            div "Comments:", :style => "color: #888; font-weight: bold; margin: 8px 0;"
            div :style => "border: 2px solid #ddd; max-height: 400px; overflow-y: auto; background: white; margin-bottom: 8px;" do
              presenter.new_comments.each do |comment|
                comment_section(comment)
              end
            end
          end
        end
      end

      def comment_section(comment)
        div :style => "border-bottom: 1px solid #ccc; padding: 8px; padding-bottom: 0;" do
          div comment.body, :style => "float: left; margin-bottom: 8px;"
          div raw("&mdash;#{comment.creator.full_name}"), :style => "white-space: nowrap; float: right; font-style: italic; color: #777; margin-bottom: 8px;"
          div :style => "clear: both;"
        end
      end

      def num_membership_presenters
        notification_presenter.membership_presenters.length
      end
    end
  end
end