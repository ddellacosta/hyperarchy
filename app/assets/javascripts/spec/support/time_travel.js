window.OriginalDate = Date;
var mockedDate;

window.Date = function(millis) {
  if (mockedDate) {
    return mockedDate;
  } else {
    if (millis) {
      return new OriginalDate(millis);
    } else {
      return new OriginalDate();
    }
  }
};

Date.__proto__ = OriginalDate;
Date.prototype = new OriginalDate();
Date.prototype.constructor = Date;


afterEach(function() {
  mockedDate = undefined;
});

function freezeTime() {
  mockedDate = new Date();
}

function timeTravelTo(date) {
  if (_.isNumber(date)) {
    mockedDate = new OriginalDate(date);
  } else if (_.isString(date)) {
    mockedDate = Date.parse(date);
  } else {
    mockedDate = date;
  }
}

function jump(milliseconds) {
  timeTravelTo(new Date().getTime() + milliseconds);
}
