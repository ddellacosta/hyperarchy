Actionitems::Application.routes.draw do
  root :to => 'home#show'
  match 'teams/:id' => 'home#show', :as => "organanization"
  match 'teams/:id/meetings/new' => 'home#show', :as => "new_team_meeting"
  match 'teams/:id/settings' => 'home#show', :as => "team_settings"
  match 'meetings/:id' => 'home#show', :as => "meeting"
  match 'meetings/:id/full_screen' => 'home#show', :as => "full_screen_meeting"
  match 'meetings/:id/agenda_items/:selected_agenda_item_id' => 'home#show', :as => "meeting_agenda_item"
  match 'meetings/:id/agenda_items/:selected_agenda_item_id/full_screen' => 'home#show', :as => "full_screen_meeting_agenda_item"
  match 'meetings/:id/votes/:selected_voter_id' => 'home#show', :as => "meeting_voter"
  match 'account' => 'home#show', :as => "account"

  match 'login' => 'sessions#new', :via => 'get', :as => "login"
  match 'login' => 'sessions#create', :via => 'post', :as => "login"
  match 'logout' => 'sessions#destroy', :via => 'post'
  match 'signup' => 'users#new', :via => 'get', :as => "signup"
  match 'signup' => 'users#create', :via => 'post', :as => "signup"

  match '/access/:team_id/:code' => 'memberships#create', :via => ['post', 'get']
  post '/feedback' => 'feedbacks#create'

  get '/sandbox' => 'sandbox#fetch'
  post '/sandbox/:relation' => 'sandbox#create'
  put '/sandbox/:relation/:id' => 'sandbox#update'
  delete '/sandbox/:relation/:id' => 'sandbox#destroy'

  post '/channel_subscriptions/teams/:id' => 'channel_subscriptions#create'
  delete '/channel_subscriptions/teams/:id' => 'channel_subscriptions#destroy'

  resources :facebook_sessions
  resources :facebook_connections
  resources :twitter_sessions
  resources :twitter_connections

  resources :shares

  # TODO: delete?
  resources :teams do
    resources :meetings
  end

  resources :users
  resources :memberships do
    get :confirm, :on => :member
  end
  resources :meetings
  resources :rankings
  resources :meeting_visits
  resources :password_reset_requests
  resources :password_resets


  if Rails.env.jasmine? || Rails.env.test?
    mount Princess::Engine => '/'
    post '/backdoor/clear_tables' => 'backdoor#clear_tables'
    post '/backdoor/upload_repository' => 'backdoor#upload_repository'
    post '/backdoor/login' => 'backdoor#login'
    post '/backdoor/login_as_special_guest' => 'backdoor#login_as_special_guest'
    post '/backdoor/:relation/multiple' => 'backdoor#create_multiple'
    get '/backdoor/initial_repository_contents' => 'backdoor#initial_repository_contents'
    get '/backdoor' => 'backdoor#fetch'
    post '/backdoor/:relation' => 'backdoor#create'
    put '/backdoor/:relation/:id' => 'backdoor#update'
    delete '/backdoor/:relation/:id' => 'backdoor#destroy'
  end

  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :notes, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :notes
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => "welcome#index"

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id(.:format)))'
end
