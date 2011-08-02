module Views
  module Layouts
    class Application < Erector::Widget
      GOOGLE_ANALYTICS_CODES = {
        "production" => 'UA-19678731-1',
        "demo" => 'UA-19678731-2',
        "development" => 'UA-19678731-3'
      }

      MIXPANEL_CODES = {
        "production" => 'f75e7802da27692104957ff1af6c2847',
        "demo" => 'dbf5ec251d715d9fc674a01c9db17ebd',
        "development" => 'a946479bf02e338e4da47b2f0fac1fec'
      }

      def html_attributes
        {
          :class => "#{controller_name} #{action_name}",
          :xmlns => "http://www.w3.org/1999/xhtml",
          'xmlns:og' => "http://ogp.me/ns#",
          'xmlns:fb' => "http://www.facebook.com/2008/fbml",
          'xml:lang' => "en"
        }
      end

      def content
        html(html_attributes)  do
          head do
            title "Actionitems"

            stylesheet_link_tag 'application'
            link :rel => "shortcut icon", :href => "/images/icon.png"
            link :rel => "image_src", :type => "image/png", :href => logo_image_url

            open_graph_properties.each do |property, content|
              meta :property => property, :content => content
            end

            csrf_meta_tag
            head_content
            typekit_javascript
            google_analytics_javascript
          end

          body :class => "#{controller_name} #{action_name}" do
            body_content
          end

          below_body_content
          mixpanel_javascript
        end
      end

      def head_content
      end

      def body_content
      end

      def below_body_content
      end

      def store_in_repository(dataset)
        %{Repository.update(#{build_client_dataset(dataset).to_json});}
      end

      def typekit_javascript
        src = "#{request.ssl?? "https" : "http"}://use.typekit.com/obb5xiy.js"
        script :type => "text/javascript", :src => src
        script "try{Typekit.load();}catch(e){}", :type => "text/javascript"
      end

      def google_analytics_javascript
        return unless analytics_enabled?

        javascript %[
          var trackPageviewManually = #{track_pageview_manually?.inspect};
          var _gaq = _gaq || [];
          _gaq.push(['_setAccount', '#{GOOGLE_ANALYTICS_CODES[Rails.env]}']);
          _gaq.push(['_setAllowAnchor', true]);
          if (!trackPageviewManually) _gaq.push(['_trackPageview']);

          (function() {
            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
          })();
        ]
      end

      def logo_image_url
        "http://#{request.host_with_port}/images/logo_108.png"
      end

      def open_graph_properties
        {
          'og:title' => "Actionitems",
          'og:type' => "article",
          'og:image' => logo_image_url,
          'og:url' => request.url,
          'og:site_name' => "Actionitems",
          'fb:app_id' => FB_ID
        }
      end

      def analytics_enabled?
        true
      end

      def track_pageview_manually?
        false
      end

      def mixpanel_javascript
        return unless analytics_enabled?

        javascript %[
          var mpq = [];
          mpq.push(["init", "#{MIXPANEL_CODES[Rails.env]}"]);
          (function() {
            var mp = document.createElement("script"); mp.type = "text/javascript"; mp.async = true;
            mp.src = (document.location.protocol == 'https:' ? 'https:' : 'http:') + "//api.mixpanel.com/site_media/js/api/mixpanel.js";
            var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(mp, s);
          })();
        ]
      end

      def javascript(text=nil, &block)
        script :type => "text/javascript", :language => "javascript" do
          rawtext text if text
          yield if block
        end
      end
    end
  end
end
