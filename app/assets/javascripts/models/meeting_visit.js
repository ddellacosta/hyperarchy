_.constructor("MeetingVisit", Model.Record, {
  constructorInitialize: function() {
    this.columns({
      userId: 'key',
      meetingId: 'key',
      updatedAt: 'datetime'
    });

    this.belongsTo('meeting');
    this.belongsTo('user');
  }
});
