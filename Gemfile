source 'http://rubygems.org'

gem 'rails', '3.1.1'
gem 'rake', '0.8.7'
gem 'thor', '0.14.6'
gem 'unicorn', '3.5.0'
gem 'thin', '1.2.11' # for resque-web on prod
gem 'prequel', :path => 'vendor/prequel'
gem 'pg', '0.9.0'
gem 'bcrypt-ruby', :require => 'bcrypt'
gem 'rgl', :require => ['rgl/base', 'rgl/adjacency', 'rgl/topsort']
gem 'erector', :path => 'vendor/erector'
gem 'resque', '1.15.0'
gem 'resque-status', '0.2.3', :require => ['resque/status', 'resque/job_with_status']
gem 'resque-scheduler', '1.9.9', :require => ['resque_scheduler']
gem 'typhoeus', '0.2.4'
gem 'redis', '2.2.0'
gem 'redis-lock', '0.1.0'
gem 'uuidtools', '2.1.2'
gem 'rack-chromeframe', '1.0.0', :require => 'rack/chrome_frame'
gem 'run_later', :path => 'vendor/run_later'
gem 'sass'
gem 'sass-rails', '3.1.4'
gem 'compass', '0.12.alpha'
gem 'uglifier', :path => 'vendor/uglifier'
gem 'jquery-rails'
gem 'old_monarch', :path => 'vendor/old_monarch'
gem 'monarch', :path => 'vendor/monarch'
gem 'fb_graph'


group :development, :test, :jasmine do
  gem 'rspec', '2.6.0'
  gem 'rspec-rails', '2.6.1'
  gem 'rr', '1.0.2'
  gem 'machinist', '1.0.6'
  gem 'faker', '0.9.5'
  gem 'spork', '~> 0.9.0.rc7'
  gem 'fuubar', '0.0.5'
  gem 'princess', :path => 'vendor/princess'
  gem 'foreman', '0.16.0'
  gem 'mailtrap', '0.2.1'
  gem 'pony', '1.1'
  gem 'rdiscount', '1.6.8'
end

group :deploy do
  gem 'net-ssh', '2.1.0'
  gem 'net-ssh-telnet', :require => 'net/ssh/telnet'
  gem 'net-sftp', :require => 'net/sftp'
end

