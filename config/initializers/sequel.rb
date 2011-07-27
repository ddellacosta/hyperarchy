database_config = Actionitems::Application.config.database_configuration[Rails.env]
::Sequel.connect(database_config.merge(:xlogger => Rails.logger))
