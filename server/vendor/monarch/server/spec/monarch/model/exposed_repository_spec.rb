require File.expand_path("#{File.dirname(__FILE__)}/../../monarch_spec_helper")

module Monarch
  module Model
    describe ExposedRepository do
      include Monarch

      attr_reader :user, :exposed_repository
      before do
        @user = User.find("jan")
        @exposed_repository = UserRepository.new(user)
      end

      describe ".expose(name, &relation_definition)" do
        it "binds a view based on the given relation definition to a table name" do
          exposed_repository.get_view(:blogs).relation.should == user.blogs
        end
      end

      describe "#fetch" do
        attr_reader :blog_posts_relation_representation, :blogs_relation_representation

        before do
          @blogs_relation_representation = {
            "type" => "selection",
            "operand" => {
              "type" => "table",
              "name" => "blogs"
            },
            "predicate" => {
              "type" => "eq",
              "left_operand" => {
                "type" => "column",
                "table" => "blogs",
                "name" => "id"
              },
              "right_operand" => {
                "type" => "scalar",
                "value" => "grain"
              }
            }
          }

          @blog_posts_relation_representation = {
            "type" => "selection",
            "operand" => {
              "type" => "table",
              "name" => "blog_posts"
            },
            "predicate" => {
              "type" => "eq",
              "left_operand" => {
                "type" => "column",
                "table" => "blog_posts",
                "name" => "blog_id"
              },
              "right_operand" => {
                "type" => "scalar",
                "value" => "grain"
              }
            }
          }
        end

        it "populates a relational dataset with the contents of an array of wire representations of relations" do
          dataset = exposed_repository.fetch([blogs_relation_representation, blog_posts_relation_representation])

          blogs_dataset_fragment = dataset["blogs"]
          blogs_dataset_fragment.size.should == 1
          blogs_dataset_fragment["grain".hash].should == Blog.find("grain").wire_representation
        end

        it "can populate a dataset from exposed projections" do
          super_blog_posts_relation_representation = {
            "type" => "selection",
            "operand" => {
              "type" => "table",
              "name" => "super_blog_posts"
            },
            "predicate" => {
              "type" => "eq",
              "left_operand" => {
                "type" => "column",
                "table" => "super_blog_posts",
                "name" => "user_id"
              },
              "right_operand" => {
                "type" => "scalar",
                "value" => "jan"
              }
            }
          }

          dataset = exposed_repository.fetch([super_blog_posts_relation_representation])
          expected_records = exposed_repository.get_view(:super_blog_posts).where(:user_id => 'jan').all
          expected_records.should_not be_empty

          expected_records.each do |record|
            dataset['super_blog_posts'][record.id].should == record.wire_representation
          end
        end
      end

      describe "#mutate" do
        context "when called with a single create operation" do
          context "when the given field values are valid" do
            it "calls #create on the indicated 'relation' with the given 'field_values', then returns all field values as its result" do
              signed_up_at = Time.now
              field_values = {
                'great_name' => "Sharon Ly",
                'age' => 25,
                'signed_up_at' => signed_up_at.to_millis
              }
              User.new(field_values).should be_valid

              successful, response_data = exposed_repository.mutate([['create', 'users', field_values]])

              new_record = User.find(User[:full_name].eq('Sharon Ly The Great'))
              new_record.should_not be_nil
              successful.should be_true
              response_data == {
                'primary' => [{
                  'id' => new_record.id,
                  'full_name' => "Sharon Ly The Great",
                  'age' => 25,
                  'signed_up_at' => signed_up_at.to_millis,
                  'has_hair' => nil,
                  'great_name' => "Sharon Ly The Great The Great",
                  'human' => true
                }],
                'secondary' => []
              }
            end

            context "when the associated record class defines a #can_create? method" do
              it "calls the #can_create? method and only precedes with the creation if it returns true" do
                mock.instance_of(User).can_create? { true }
                exposed_repository.mutate([['create', 'users', {'full_name' => "John Madden"}]])
                mock.instance_of(User).can_create? { false }
                lambda do
                  exposed_repository.mutate([['create', 'users', {'full_name' => "Ted Leitner"}]])
                end.should raise_error(Monarch::Unauthorized)
              end
            end

            context "when the associated record class defines #create_whitelist / #create_blacklist methods" do
              it "only allows the record to be instantiated with the permitted columns" do
                user = User.new
                # this is a very convoluted approach, but RR seems to only allow me to stub one method at a time with
                # the stub.instance_of(User) approach, so I create a stand-in instance to stub instead
                stub(User.table).build { user }
                stub(user).create_blacklist { [:has_hair] }
                stub(user).create_whitelist { [:full_name, :great_name, :has_hair] }
                exposed_repository.mutate([['create', 'users', {'full_name' => "Justin Timberlake"}]])

                # on blacklist
                lambda do
                  exposed_repository.mutate([['create', 'users', {'full_name' => "Justin Timberlake", 'has_hair' => true}]])
                end.should raise_error(Monarch::Unauthorized)

                # not on whitelist
                lambda do
                  exposed_repository.mutate([['create', 'users', {'full_name' => "Justin Timberlake", 'age' => 32}]])
                end.should raise_error(Monarch::Unauthorized)
              end
            end
          end

          context "when the given field values are invalid" do
            it "calls #create on the indicated 'relation' with the given 'field_values', then returns all the validation errors as its result" do
              field_values = {
                'full_name' => "Baby Sharon Ly",
                'age' => 2
              }
              invalid_example = User.new(field_values)
              invalid_example.should_not be_valid

              successful, response_data = exposed_repository.mutate([['create', 'users', field_values]])

              User.find(User[:full_name].eq("Baby Sharon Ly")).should be_nil

              successful.should be_false
              response_data.should == {
                'index' => 0,
                'errors' => { 'age' => invalid_example.field(:age).validation_errors}
              }
            end
          end
        end

        context "when called with a single update operation" do
          context "when the given field values are valid" do
            attr_reader :record
            before do
              @record = User.find('jan')
            end

            it "finds the record with the given 'id' in the given 'relation', then updates it with the given field values and returns its wire representation" do
              new_signed_up_at = record.signed_up_at - 1.hours
              field_values = {
                'great_name' => "Jan Christian Nelson",
                'age' => record.age,
                'signed_up_at' => new_signed_up_at.to_millis
              }

              successful, response_data = exposed_repository.mutate([['update', 'users', 'jan', field_values]])

              record.reload
              record.full_name.should == "Jan Christian Nelson The Great"
              record.age.should == 31
              record.signed_up_at.to_millis.should == new_signed_up_at.to_millis

              successful.should be_true
              response_data.should == {
                'primary' => [record.wire_representation.stringify_keys],
                'secondary' => []
              }
            end

            context "when the associated record class defines a #can_update? method" do
              it "calls #can_update?, and only precedes with the update if it returns true" do
                mock(record).can_update? { true }
                exposed_repository.mutate([['update', 'users', 'jan', {'full_name' => "Janford Nelson"}]])
                mock(record).can_update? { false }
                lambda do
                  exposed_repository.mutate([['update', 'users', 'jan', {'full_name' => "Elizabeth Scarborough"}]])
                end.should raise_error(Monarch::Unauthorized)
              end
            end

            context "when the associated record class defines #update_whitelist / #update_blacklist methods" do
              it "only precedes with the update if updating fields that are not black-listed" do
                stub(record).update_whitelist { [:full_name, :great_name, :has_hair] }
                stub(record).update_blacklist { [:has_hair] }
                exposed_repository.mutate([['update', 'users', 'jan', {'full_name' => "Justin Timberlake"}]])

                # on blacklist
                lambda do
                  exposed_repository.mutate([['update', 'users', 'jan', {'has_hair' => false}]])
                end.should raise_error(Monarch::Unauthorized)

                # not on whitelist
                lambda do
                  exposed_repository.mutate([['update', 'users', 'jan', {'age' => 99}]])
                end.should raise_error(Monarch::Unauthorized)
              end
            end
          end

          context "when the given field values are invalid" do
            it "returns the validation errors in an unsuccessful response" do
              record = User.find('jan')
              pre_update_age = record.age

              successful, response_data = exposed_repository.mutate([['update', 'users', 'jan', { :age => 3}]])

              record.reload
              record.age.should == pre_update_age

              successful.should be_false
              response_data.should == {
                'index' => 0,
                'errors' => { 'age' => ["User must be at least 10 years old"]}
              }
            end
          end

          context "when the given field values would cause the record to no longer be contained by the exposed relation" do
            it "returns a security error and does not perform the update" do
              successful, response_data = exposed_repository.mutate([['update', 'blogs', 'grain', { 'user_id' => 'wil' }]])
              successful.should be_false
              response_data.should == {"errors"=>"Security violation", "index"=>0}
              Blog.find('grain').reload.user_id.should == 'jan'.hash
            end
          end
        end

        context "when called with a single destroy operation" do
          it "finds the record with the given 'id' in the given 'relation', then destroys it" do
            User.find('jan').should_not be_nil

            successful, response_data = exposed_repository.mutate([['destroy', 'users', 'jan']])

            User.find('jan').should be_nil

            successful.should be_true
            response_data.should == {
              'primary' => [nil],
              'secondary' => []
            }
          end

          context "when the associated record class defines #can_destroy?" do
            attr_reader :record
            before do
              @record = User.find('jan')
            end

            it "calls #can_destroy, and only precedes with the destruction if it returns true" do
              mock(record).can_destroy? { false }
              lambda do
                exposed_repository.mutate([['destroy', 'users', 'jan']])
              end.should raise_error(Monarch::Unauthorized)
              mock(record).can_destroy? { true }
              exposed_repository.mutate([['destroy', 'users', 'jan']])
            end
          end
        end

        context "when called with multiple operations" do
          context "when all operations are valid" do
            it "performs all operations and returns a result for each" do
              signed_up_at = Time.now
              User.find('jan').should_not be_nil

              successful, response_data = exposed_repository.mutate([
                ['create', 'users', { 'full_name' => "Jake Frautschi", 'age' => 27, 'signed_up_at' => signed_up_at.to_millis }],
                ['update', 'users', 'jan', {'age' => 101}],
                ['destroy', 'users', 'wil']
              ])

              jake = User.find(User[:full_name].eq("Jake Frautschi"))
              jake.should_not be_nil
              jan = User.find("jan")
              jan.age.should == 101
              User.find('wil').should be_nil

              successful.should be_true
              response_data.should == {
                'primary' => [
                  {
                    'id' => jake.id,
                    'full_name' => "Jake Frautschi",
                    'age' => 27,
                    'signed_up_at' => signed_up_at.to_millis,
                    'has_hair' => nil,
                    'great_name' => "Jake Frautschi The Great",
                    'terrible_name' => "Jake Frautschi The Terrible",
                    'human' => true
                  },
                  jan.wire_representation.stringify_keys,
                  nil
                ],
                'secondary' => []
              }
            end
          end

          context "when some operations are invalid" do
            manually_manage_identity_map

            it "rolls back all operations and returns validation errors for each" do
              signed_up_at = Time.now
              jan = User.find('jan')
              age_before_update = jan.age

              Monarch::Model::Repository.initialize_local_identity_map
              successful, response_data = exposed_repository.mutate([
                ['create', 'users', { 'full_name' => "Jake Frautschi", 'age' => 27, 'signed_up_at' => signed_up_at.to_millis }],
                ['update', 'users', 'jan', {'age' => 3}],
                ['destroy', 'users', 'wil']
              ])
              Monarch::Model::Repository.clear_local_identity_map

              User.find(User[:full_name].eq("Jake Frautschi")).should be_nil

              User.find("jan").age.should == age_before_update
              User.find('wil').should_not be_nil

              successful.should be_false
              response_data.should == {
                'index' => 1,
                'errors' => { 'age' => ["User must be at least 10 years old"] }
              }
            end
          end
        end
      end

      describe "#subscribe and #unsubscribe" do
        specify "#subscribe converts the 'relations' JSON into actual relations defined in terms of the exposed tables and calls #current_comet_client.subscribe with them and #unsubscribe calls #current_comet_client.unsubscribe with each subscription_id" do
          relations = [{ "type" => "table", "name" => "blogs"}, { "type" => "table", "name" => "blog_posts"}]

          mock_relation_1 = Object.new
          mock_relation_2 = Object.new
          mock(exposed_repository).build_relation_from_wire_representation({ "type" => "table", "name" => "blogs"}) { mock_relation_1 }
          mock(exposed_repository).build_relation_from_wire_representation({ "type" => "table", "name" => "blog_posts"}) { mock_relation_2 }

          real_time_client = Rack::FakeRealTimeClient.new
          mock(real_time_client).subscribe(mock_relation_1) { "mock_subscription_id_1"}
          mock(real_time_client).subscribe(mock_relation_2) { "mock_subscription_id_2"}

          successful, response_data = exposed_repository.subscribe(real_time_client, relations)

          successful.should be_true
          response_data.should == ["mock_subscription_id_1", "mock_subscription_id_2"]

          mock(real_time_client).unsubscribe("mock_subscription_id_1")
          mock(real_time_client).unsubscribe("mock_subscription_id_2")
          exposed_repository.unsubscribe(real_time_client, ["mock_subscription_id_1", "mock_subscription_id_2"]).should be_true
        end
      end

      describe "#build_relation_from_wire_representation" do
        before do
          publicize exposed_repository, :build_relation_from_wire_representation
        end

        it "delegates to Relation#from_wire_representation with self as the repository" do
          representation = {
            "type" => "table",
            "name" => "blogs"
          }
          mock(Relations::Relation).from_wire_representation(representation, exposed_repository)
          exposed_repository.build_relation_from_wire_representation(representation)
        end


        it "resolves relation names to primitive Tables" do
          view = exposed_repository.build_relation_from_wire_representation({
            "type" => "table",
            "name" => "blog_posts"
          })
          view.relation.should == exposed_repository.user.blog_posts
        end
      end

      describe "#get_view" do
        it "returns the exposed view by the given name, creating it temporarily in the database the first time its called for a given name" do
          ddl_sql = nil
          ddl_literals = nil
          mock(Origin).execute_ddl(anything, anything).once do |sql, literals|
            ddl_sql = sql
            ddl_literals = literals
          end
          
          view = exposed_repository.get_view(:blog_posts)
          [ddl_sql, ddl_literals].should == view.to_sql(:temporary)

          exposed_repository.get_view(:blog_posts)
        end
      end

      describe "#drop_views" do
        it "drops any views that were created by previous calls to #get_view and clears the view cache" do
          stub(Origin).execute_ddl

          view_1 = exposed_repository.get_view(:blog_posts)
          view_2 = exposed_repository.get_view(:blogs)
          mock(view_1).drop_view
          mock(view_2).drop_view

          exposed_repository.drop_views


          exposed_repository.get_view(:blog_posts).should_not eql(view_1)
        end
      end
    end
  end
end
