//= require "../../hyperarchy_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Controllers.Application", function() {
    useFakeServer();
    useRemoteFixtures();

    var controller, mockBody;
    before(function() {
      controller = new Controllers.Application($("<div/>"));
    });

    describe("#navigate", function() {
      context("when called with '' (empty string)", function() {
        it("shows the login view and hides the others", function() {
          controller.navigate("");
          expect(controller.body.children().length).to(equal, 1);
          expect(controller.body.children("#login").length).to(equal, 1);
        });
      });

      context("when called with 'login'", function() {
        it("shows the login view and hides the others", function() {
          controller.navigate("login");
          expect(controller.body.children().length).to(equal, 1);
          expect(controller.body.children("#login").length).to(equal, 1);
        });
      });

      context("when called with 'signup'", function() {
        it("shows the signup view and hides the others", function() {
          controller.navigate("signup");
          expect(controller.body.children().length).to(equal, 1);
          expect(controller.body.children("#signup").length).to(equal, 1);
        });
      });

      context("when called with 'organization'", function() {
        it("shows the elections view and hides the others", function() {
          controller.navigate("organization");
          expect(controller.body.children().length).to(equal, 1);
          expect(controller.body.children("#organization").length).to(equal, 1);
        });
      });
    });

    describe("#currentUserIdEstablished", function() {
      it("assigns #currentUserId to the given id", function() {
        expect(controller.currentUserId).to(beNull);
        controller.currentUserIdEstablished('billy');
        expect(controller.currentUserId).to(equal, 'billy');
      });
    });
  });
}});