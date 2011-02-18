require File.expand_path("#{File.dirname(__FILE__)}/../../../monarch_spec_helper")

module Monarch
  module Model
    module Relations
      describe Selection do
        include Monarch::Model

        describe "class methods" do
          describe ".from_wire_representation" do
            it "builds a Selection with an #operand resolved in the given repository" do
              repository = UserRepository.new(User.find("jan"))
              selection = Selection.from_wire_representation({
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
              }, repository)

              selection.class.should == Relations::Selection
              selection.operand.should == repository.get_view(:blog_posts)
              selection.predicate.class.should == Expressions::Eq
              selection.predicate.left_operand.should == repository.get_view(:blog_posts).column(:blog_id)
              selection.predicate.right_operand.should == "grain".hash
            end
          end
        end

        attr_reader :operand, :predicate, :selection, :predicate_2, :composite_selection
        before do
          @operand = BlogPost.table
          @predicate = Expressions::Eq.new(BlogPost[:blog_id], "grain")
          @selection = Selection.new(operand, predicate)
          @predicate_2 = Expressions::Eq.new(BlogPost[:body], FIXTURES[:blog_posts][:grain_barley][:body])
          @composite_selection = Selection.new(selection, predicate_2)
        end

        describe "#all" do
          context "when #operand is a Table" do
            it "executes an appropriate SQL query against the database and returns Records corresponding to its results" do
              BlogPost.table.all.detect {|t| t.blog_id == "grain".hash}.should_not be_nil
              all = selection.all
              all.should_not be_empty
              all.each do |record|
                record.blog_id.should == "grain".hash
              end
            end
          end

          context "when #operand is a Selection" do
            it "executes an appropriate SQL query against the database and returns Records corresponding to its results" do
              record = composite_selection.all.first
              record.should_not be_nil
              record.blog_id.should == "grain".hash
              record.body.should == FIXTURES[:blog_posts][:grain_barley][:body]
            end
          end
        end

        describe "#build(field_values)" do
          it "introduces an additional field value to match its predicate if needed" do
            mock(operand).build(:blog_id => "grain".hash, :body => FIXTURES[:blog_posts][:grain_barley][:body], :title => "Barely Barley")
            composite_selection.build(:title => "Barely Barley")
          end
        end

        describe "#create(field_values)" do
          it "introduces an additional field value to match its predicate if needed" do
            mock(operand).create!(:blog_id => "grain".hash, :body => FIXTURES[:blog_posts][:grain_barley][:body], :title => "Barely Barley")
            composite_selection.create!(:title => "Barely Barley")
          end
        end

        describe "#==" do
          it "structurally compares the receiver with the operand" do
            predicate_2 = Expressions::Eq.new(BlogPost[:blog_id], "grain")
            selection_2 = Selection.new(operand, predicate_2)

            selection.should == selection_2
          end
        end

        describe "event handling" do
          describe "propagation of operand events" do
            attr_reader :on_insert_calls, :on_update_calls, :on_remove_calls, :on_insert_subscription, :on_update_subscription, :on_remove_subscription
            before do
              @on_insert_calls = []
              @on_update_calls = []
              @on_remove_calls = []

              @on_insert_subscription = selection.on_insert do |record|
                on_insert_calls.push(record)
              end
              @on_update_subscription = selection.on_update do |record, changeset|
                on_update_calls.push([record, changeset])
              end
              @on_remove_subscription = selection.on_remove do |record|
                on_remove_calls.push(record)
              end
            end

            after do
              on_insert_subscription.destroy
              on_update_subscription.destroy
              on_remove_subscription.destroy
            end

            describe "when a record is inserted in the operand" do
              describe "when the record is a member of the selection" do
                it "fires #on_insert callbacks with the record" do
                  record = BlogPost.create!(:blog_id => "grain")
                  on_insert_calls.should == [record]
                  on_update_calls.should be_empty
                  on_remove_calls.should be_empty
                end
              end

              describe "when the record is not a member of the selection" do
                it "fires no event callbacks" do
                  BlogPost.create!(:blog_id => "recipes")
                  on_insert_calls.should be_empty
                  on_update_calls.should be_empty
                  on_remove_calls.should be_empty
                end
              end
            end

            describe "when a record is updated in the operand" do
              describe "when the record was not previously a member of the selection but now it is" do
                it "fires #on_insert callbacks with the record" do
                  record = BlogPost.find(BlogPost[:blog_id].neq("grain"))
                  record.update(:blog_id => "grain")

                  on_insert_calls.should == [record]
                  on_update_calls.should be_empty
                  on_remove_calls.should be_empty
                end
              end

              describe "when the record was not previously a member of the selection and it still isn't" do
                it "fires no event callbacks" do
                  record = BlogPost.find(BlogPost[:blog_id].neq("grain"))
                  record.update(:blog_id => "hamburgers")

                  on_insert_calls.should be_empty
                  on_update_calls.should be_empty
                  on_remove_calls.should be_empty
                end

              end

              describe "when the record was previously a member of the selection and now it isn't" do
                it "fires #on_remove callbacks with the record" do
                  record = BlogPost.find(BlogPost[:blog_id].eq("grain"))
                  record.update(:blog_id => "hamburgers")

                  on_insert_calls.should be_empty
                  on_update_calls.should be_empty
                  on_remove_calls.should == [record]
                end
              end

              describe "when the record was previously a member of the selection and it still is" do
                it "fires #on_update callbacks with the record and the changeset" do
                  Timecop.freeze(Time.now)
                  record = BlogPost.find(BlogPost[:blog_id].eq("grain"))
                  record.update(:title => "New title")

                  on_insert_calls.should be_empty

                  on_update_calls.should_not be_empty
                  on_update_record, on_update_changeset = on_update_calls.first
                  on_update_record.should == record
                  on_update_changeset.wire_representation.should == {"title" => "New title", "updated_at" => Time.now.to_millis}

                  on_remove_calls.should be_empty
                end
              end
            end

            describe "when a record is removed from the operand" do
              describe "when the record was previously a member of the selection" do
                it "fires #on_insert callbacks with the record" do
                  record = BlogPost.find(BlogPost[:blog_id].eq("grain"))
                  record.destroy

                  on_insert_calls.should be_empty
                  on_update_calls.should be_empty
                  on_remove_calls.should == [record]
                end
              end

              describe "when the record was not previously a member of the selection" do
                it "fires no event callbacks" do
                  record = BlogPost.find(BlogPost[:blog_id].neq("grain"))
                  record.destroy

                  on_insert_calls.should be_empty
                  on_update_calls.should be_empty
                  on_remove_calls.should be_empty
                end
              end
            end
          end

          describe "subscription lifecycle" do
            it "subscribes to its operand the first time a subscription is made on the selection and unsubscribes once the last subscription is destroyed" do
              subscription_1, subscription_2 = nil

              lambda do
                subscription_1 = selection.on_insert { }
              end.should change {selection.operand.num_subscriptions}.by(3)

              lambda do
                subscription_2 = selection.on_insert { }
              end.should_not change {selection.operand.num_subscriptions}

              lambda do
                subscription_1.destroy
              end.should_not change {selection.operand.num_subscriptions}

              lambda do
                subscription_2.destroy
              end.should change {selection.operand.num_subscriptions}.by(-3)
            end
          end
        end
      end
    end
  end
end
