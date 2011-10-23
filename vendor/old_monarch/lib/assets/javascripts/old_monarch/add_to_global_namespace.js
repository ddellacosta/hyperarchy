(function(OldMonarch) {

_.each(OldMonarch, function(value, key) {
  if (key == "constructor" || key == "module") return;
  window[key] = value;
});

})(OldMonarch);
