require File.expand_path('../boot', __FILE__)

require 'action_controller/railtie'
require 'sequel-rails/railtie'
require 'action_mailer/railtie'

# If you have a Gemfile, require the gems listed there, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(:default, Rails.env) if defined?(Bundler)

require 'erector/rails/railtie'

module Hyperarchy
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    config.autoload_paths += %W(#{config.root}/app)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Please note that JavaScript expansions are *ignored altogether* if the asset
    # pipeline is enabled (see config.assets.enabled below). Put your defaults in
    # app/assets/javascripts/application.js in that case.
    #
    # JavaScript files you want as :defaults (application.js is always included).
    # config.action_view.javascript_expansions[:defaults] = %w(prototype prototype_ujs)

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Enable the asset pipeline
    config.assets.enabled = true
    config.assets.precompile = ['application.js', 'hyperarchy.css']
    config.assets.js_compressor = :uglifier
    # config.assets.js_compressor_options = { :except => ['$super'] }

    # Make IE use ChromeFrame
    config.middleware.use Rack::ChromeFrame
  end
end

HYPERARCHY_BLURB =       %{Hyperarchy helps your organization track its own collective opinion.
It lets you put any issue to a vote by raising questions, then allows members to suggest and rank answers to these questions.
As individuals change their rankings, Hyperarchy computes and broadcasts the evolving consensus in real time, making it easier to communicate and make decisions.}

SOCKET_SERVER_HOST = 'localhost:8082'

#api_keys = YAML.load_file(Rails.root.join('config/api_keys.yml'))

# FB_ID = api_keys['facebook']['id']
# FB_SECRET = api_keys['facebook']['secret']
# TWITTER_ID = api_keys['twitter']['id']
# TWITTER_SECRET = api_keys['twitter']['secret']

FB_ID = 1
FB_SECRET = 2
TWITTER_ID = 3
TWITTER_SECRET = 4
