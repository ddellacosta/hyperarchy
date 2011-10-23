//= require monarch_spec_helper

Screw.Unit(function(c) { with(c) {
  describe("OldMonarch.SubscriptionNode", function() {
    var node;

    before(function() {
      node = new OldMonarch.SubscriptionNode();
    });

    describe("#publishForPromise", function() {
      var successCallback, promise1, promise2;
      before(function() {
        promise1 = new OldMonarch.Promise();
        promise2 = new OldMonarch.Promise();

        callback1 = mockFunction("callback1", function() {
          return promise1;
        });
        callback2 = mockFunction("callback2", function() {
          return promise2;
        });

        successCallback = mockFunction("successCallback");

        node.subscribe(callback1);
        node.subscribe(callback2);
      });

      it("builds a promise that waits on the success of all promises returned by subscribed callbacks", function() {
        var combinedPromise = node.publishForPromise("foo");
        combinedPromise.success(successCallback);

        expect(successCallback).toNot(haveBeenCalled);
        promise1.triggerSuccess();
        expect(successCallback).toNot(haveBeenCalled);
        promise2.triggerSuccess();
        expect(successCallback).to(haveBeenCalled);
      });

      it("triggers success on the promise if there are no subscriptions or if none of the subscriptions return a promise themselves to wait on", function() {
        node = new OldMonarch.SubscriptionNode();
        node.publishForPromise("foo").success(successCallback);
        expect(successCallback).to(haveBeenCalled);

        successCallback.clear();

        node.subscribe(function() { });
        node.publishForPromise("foo").success(successCallback);
        expect(successCallback).to(haveBeenCalled);
      });
    });
  });
}});
