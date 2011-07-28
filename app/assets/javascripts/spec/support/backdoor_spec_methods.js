function clearServerTables() {
  synchronously(function() {
    $.post('/backdoor/clear_tables');
  });
}

function login(user) {
  return synchronously(function() {
    var data;
    if (user) data = { user_id: user.id() };
    $.ajax({
      type: 'post',
      data: data,
      url: "/backdoor/login",
      dataType: 'data+records!'
    }).success(function(data) {
      Application.currentUserId(data.current_user_id)
    });
    return Application.currentUser();
  });
}

function loginAsSpecialGuest(team) {
  return synchronously(function() {
    $.ajax({
      type: 'post',
      data: { team_id: team.id() },
      url: "/backdoor/login_as_special_guest",
      dataType: 'data+records!',
      success: function(data) {
        Application.currentUserId(data.current_user_id);
      }
    });
    return Application.currentUser();
  });
}

function fetchInitialRepositoryContents() {
  synchronously(function() {
    $.ajax({
      type: 'get',
      url: "/backdoor/initial_repository_contents",
      dataType: 'data+records!'
    }).success(function(data) {
        Application.currentUserId(data.current_user_id);
      });
  });
}

function uploadRepository() {
  var wireRepresentation = {};
  _.each(Repository.tables, function(table, tableName) {
    wireRepresentation[tableName] = {};
    table.each(function(record) {
      wireRepresentation[tableName][record.id()] = record.wireRepresentation();
    });
  });

  synchronously(function() {
    $.ajax({
      type: 'post',
      url: "/backdoor/upload_repository",
      dataType: 'records',
      data: { records: JSON.stringify(wireRepresentation) }
    });
  });
}

function usingBackdoor(callback) {
  synchronously(function() {
    var previousSandboxUrl = Server.sandboxUrl;
    Server.sandboxUrl = '/backdoor';
    callback();
    Server.sandboxUrl = previousSandboxUrl;
  });
}

function createMultiple(options) {
  synchronously(function() {
    $.ajax({
      type: 'post',
      url: '/backdoor/' + options.tableName + '/multiple',
      data: {
        count: options.count,
        field_values: _.underscoreKeys(options.fieldValues)
      },
      dataType: 'records'
    });
  });
}

function synchronously(callback) {
  var previousAsyncSetting = jQuery.ajaxSettings.async;
  jQuery.ajaxSettings.async = false;
  var result = callback();
  jQuery.ajaxSettings.async = previousAsyncSetting;
  return result;
}
