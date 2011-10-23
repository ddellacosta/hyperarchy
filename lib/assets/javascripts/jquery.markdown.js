(function(jQuery, Attacklab) {
  var urlRegex = /(^|[^'"])(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])($|[^'"])/ig;
  var markdownConverter = new Attacklab.showdown.converter();

  jQuery.markdown = function(string) {
    if (!string) return string;
    var stringWithoutTags = $("<div>" + string + "</div>").text();
    var convertedFromMarkdown = markdownConverter.makeHtml(stringWithoutTags);
    var stringWithLinkedUrls = convertedFromMarkdown.replace(urlRegex, '$1<a class="link" href="$2">$2</a>$4');
    return stringWithLinkedUrls;
  }

  jQuery.fn.extend({
    markdown: function(string) {
      this.html(jQuery.markdown(string));
    },

    bindMarkdown: function(record, fieldName) {
      var existingSubscription = this.data('bindTextSubscription');
      if (existingSubscription) existingSubscription.destroy();
      var field = record.getRemoteField(fieldName);
      if (!field) throw new Error("No field named " + fieldName + " found.");
      this.markdown(field.getValue());

      var subscription = field.onChange(function(newValue) {
        this.markdown(newValue);
      }, this);
      this.data('bindTextSubscription', subscription);

      this.attr('textIsBound', true);
    }
  });
})(jQuery, Attacklab);
