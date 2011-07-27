module Views
  module Home
    class Show < Views::Layouts::Application
      def track_pageview_manually?
        true
      end

      def body_content
        div :id => "fb-root"
        facebook_javascript
        div :id => "loadingPage" do
          div :id => "mediumLogo"
          div :class => "bigLoading matchesBodyBackground"
        end
      end

      def below_body_content
        javascript_include_tag("application", :debug => Rails.env.development?)
        javascript %[
          $(function() {
            window.WEB_SOCKET_SWF_LOCATION = '/WebSocketMain.swf';
            Meeting.SCORE_EXTRA_VOTES = #{Meeting::SCORE_EXTRA_VOTES};
            Meeting.SCORE_EXTRA_HOURS = #{Meeting::SCORE_EXTRA_HOURS};
            Meeting.SCORE_GRAVITY = #{Meeting::SCORE_GRAVITY};
            #{store_in_repository(current_user.initial_repository_contents)}
            window.Application = Views.Layout.toView();
            Application.environment = #{Rails.env.to_json};
            $('body').append(Application);
            Application.attach();
            Application.currentUserId(#{current_user_id});
            Path.listen();
            Application.TWITTER_ID = '#{TWITTER_ID}';
            Application.loadTwitterJs();
          });
        ]
      end

      def facebook_javascript
        javascript %[
          window.fbAsyncInit = function() {
            FB.init({appId: '207827675895197', status: true, cookie: true, xfbml: false});
            if (window.Application) Application.facebookInitialized();
          };
          (function() {
            var e = document.createElement('script'); e.async = true;
            e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
            //e.src = document.location.protocol + '//static.ak.fbcdn.net/connect/en_US/core.debug.js';
            document.getElementById('fb-root').appendChild(e);
          }());
        ]
      end
    end
  end
end
