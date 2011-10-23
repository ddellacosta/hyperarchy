(function(OldMonarch) {

_.constructor("OldMonarch.View.SelfClosingTag", OldMonarch.View.CloseTag.prototype, OldMonarch.View.OpenTag.prototype, {
  toXml: function() {
    return "<" + this.name + this.attributesHtml() + "/>"
  },

  postProcess: function(builder) {
    builder.pushChild();
    builder.popChild();
    if (this.onBuildNode) this.onBuildNode.publish(builder.findPrecedingElement(), builder.jqueryFragment);
  }
});

})(OldMonarch);
