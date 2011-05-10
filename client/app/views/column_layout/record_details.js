_.constructor("Views.ColumnLayout.RecordDetails", View.Template, {

  // properties to override, examples:
  tableName: null,          // "elections",
  informalTableName: null,  // "Questions",
  recordConstructor: null,  // Election,
  commentConstructor: null, // ElectionComment,
  childConstructors: {},    // {candidates: Candidate}
  informalChildNames: {},   // {candidates: "Answers"},

  minTruncationLength: 100,
  maxTruncationLength: 250,

  content: function() {with(this.builder) {
    div({'class': _.singularize(template.tableName) + " recordDetails"}, function() {

      div({'class': "content"}, function() {
        p({'class': "body"}).ref("body");
        span({'class': "details truncated"}).ref("truncatedDetails");
        span({'class': "details", style: "display: none;"}).ref("details");
        span("...", {'class': "ellipsis", style: "display: none;"})
          .ref("detailsEllipsis");
      }).ref("content");

      div({'class': "editable content"}, function() {
        textarea({'class': "body", placeholder: "Short " + _.singularize(template.informalTableName)})
          .ref('editableBody')
          .keydown(template.keydownHandler);
        textarea({'class': "details", placeholder: "Further details"})
          .ref('editableDetails')
          .keydown(template.keydownHandler);
      }).ref("editableContent");

      div({'class': "footer"}, function() {
        button("more", {'class': "expand", style: "display: none;"})
          .ref("expandButton")
          .click("expandDetails");
        button("less", {'class': "contract", style: "display: none;"})
          .ref("contractButton")
          .click("contractDetails");
        button("edit", {'class': "edit", style: "display: none;"})
          .ref("editButton")
          .click("enableEditing");
        button("save", {'class': "save", style: "display: none;"})
          .ref("updateButton")
          .click("updateRecord");
        button("save", {'class': "save", style: "display: none;"})
          .ref("createButton")
          .click("createRecord");
        button("cancel", {'class': "cancel"})
          .ref("cancelButton")
          .click("disableEditing");
        
        subview('avatar', Views.Avatar, {size: 35});
        span({'class': "name"}, "").ref('creatorName');
        br();
        span({'class': "date"}, "").ref('createdAt');

        div({'class': "clear"});
      });
      
      ul({'class': "childLinks"}, function() {
        _.each(template.informalChildNames, function(informalName, tableName) {
          li(function() { 
            a(function() {
              div({'class': "icon"}).ref(tableName + "LinkIcon");
              span().ref(tableName + "Number");
              raw(' ');
              span().ref(tableName + "Text");
            }).ref(tableName + "Link").click("showChildTable", tableName);
          })
        }, this);
      }).ref("childLinksList");

      if (template.commentConstructor) {
        div({'class': "comments"}, function() {
          a({'class': "header"}, function() {
            span().ref("commentsNumber");
            raw(' ');
            span().ref("commentsText");
            div({'class': "expand icon"}).ref("commentsExpandIcon");
          }).ref("commentsHeader").click("toggleComments");
          div({'class': "body", style: "display: none;"}, function() {
            subview('commentsList', Views.SortedList, {
              buildElement: function(comment) {
                return Views.ColumnLayout.CommentLi.toView({comment: comment})
              }});
            textarea({'class': "comment", placeholder: "Write a comment..."}).
              ref('editableComment').
              keydown(template.keydownHandler);
            div({'class': "clear"});
          }).ref("commentsBody");
        });
      }

      div({'class': "loading"}).ref("loading");
    });
  }},

  keydownHandler: function(view, event) {
    switch (event.keyCode) {
      case 27: // escape
        view.disableEditing();
        event.preventDefault();
        break;
      case 13: // enter
        if (event.ctrlKey) break;
        if ($(event.target).hasClass('comment')) {
          view.createComment();
        } else { 
          view.saveEdits();
        }
        event.preventDefault();
        break;
    }
  },

  viewProperties: {

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.editableComment.elastic();
    },

    recordId: {
      afterChange: function(recordId) {
        if (! recordId) return;
        this.subscriptions.destroy();
        this.contractComments();
        if (recordId === "new") {
          this.newRecord();
          return;
        }

        recordId = parseInt(recordId);
        this.record(this.template.recordConstructor.find(recordId));
        var foreignKeyName = _.singularize(this.template.tableName) + "Id";
        var conditionHash = {}; conditionHash[foreignKeyName] = recordId;
        var relationsToFetch = _.map(this.template.childConstructors, function(constructor) {
          return constructor.where(conditionHash);
        }, this);
        if (this.commentsList) {
          relationsToFetch.push(this.template.commentConstructor.where(conditionHash).
            join(User).on(this.template.commentConstructor.creatorId.eq(User.id)));
        }
        Server.fetch(relationsToFetch).onSuccess(function() {
          this.subscribeToChildRelationChanges();
        }, this)
      }
    },

    selectedChildTableName: {
      afterChange: function(selectedTableName) {
        _.each(this.template.childConstructors, function(constructor, tableName) {
          this[tableName + 'Link'].removeClass('selected');
        }, this);
        if (this[selectedTableName + 'Link']) {
          this[selectedTableName + 'Link'].addClass('selected');
        }
      }
    },

    // private

    record: {
      afterWrite: function(record) {
        this.disableEditing();
        this.body.bindHtml(record, "body");
        this.details.bindHtml(record, "details");
        this.editableBody.val(record.body());
        this.editableDetails.val(record.details());
        var updateTruncatedDetails = function(details) {
          var breakPosition = details.lastIndexOf(' ', this.template.maxTruncationLength);
          if (breakPosition < this.template.minTruncationLength) {
            breakPosition = this.template.maxTruncationLength;
          }
          this.truncatedDetails.html(details.slice(0, breakPosition));
          this.showOrTruncateDetails();
        };
        updateTruncatedDetails.call(this, record.details());
        this.subscriptions.add(record.field('details').onUpdate(updateTruncatedDetails, this));

        this.editableDetails.elastic();
        this.editableBody.elastic();
        if (record.editableByCurrentUser()) this.editButton.show();

        var creator = User.find(record.creatorId());
        this.avatar.user(creator);
        this.creatorName.html(htmlEscape(creator.fullName()));
        this.createdAt.html(record.formattedCreatedAt());
        this.childLinksList.show();
      }
    },

    showChildTable: function(tableName) {
      this.containingView.containingColumn.pushNextState({tableName: tableName});
    },

    subscribeToChildRelationChanges: function() {
      var childTableNames = _.keys(this.template.childConstructors);
      if (this.commentsList) {
        this.commentsList.relation(this.record().comments());
        childTableNames.push('comments');
      }

      _.each(childTableNames, function(tableName) {
        var relation = this.record()[tableName]();
        this.updateLinkNumber(tableName);
        this.subscriptions.add(relation.onInsert(function() {
          this.updateLinkNumber(tableName);
        }, this));
        this.subscriptions.add(relation.onRemove(function() {
          this.updateLinkNumber(tableName);
        }, this));
      }, this);
    },

    updateLinkNumber: function(tableName) {
      var relation     = this.record()[tableName]();
      var size         = relation.size();
      var informalName = tableName === 'comments' ? "Comments" : 
                         this.template.informalChildNames[tableName];
      if (size > 1) {
        this[tableName + "Number"].html(size);
        this[tableName + "Text"].html(informalName);
      } else if (size === 1) {
        this[tableName + "Number"].html(1);
        this[tableName + "Text"].html(_.singularize(informalName));
      } else {
        var indefiniteArticle = informalName.match(/^[aeiou]/) ? "an " : "a ";
        this[tableName + "Number"].html('');
        this[tableName + "Text"].html("Add " + indefiniteArticle + _.singularize(informalName));
      }
    },

    showOrTruncateDetails: function() {
      if (this.expanded) {
        this.expandButton.hide();
        this.detailsEllipsis.hide();
        this.truncatedDetails.hide();
        this.details.show();
        if (this.record().details().length > this.template.maxTruncationLength) {
          this.contractButton.show();
        } else {
          this.contractButton.hide();
        }
      } else {
        this.contractButton.hide();
        if (this.record().details().length > this.template.maxTruncationLength) {
          this.details.hide();
          this.truncatedDetails.show();
          this.expandButton.show();
          this.detailsEllipsis.show();
        } else {
          this.details.show();
          this.truncatedDetails.hide();
          this.expandButton.hide();
          this.detailsEllipsis.hide();
        }
      }
    },

    newRecord: function() {
      var creator = User.find(Application.currentUserId);
      this.avatar.user(creator);
      this.creatorName.html(htmlEscape(creator.fullName()));
      this.createdAt.html("");
      this.childLinksList.hide();
      this.enableCreating();
      // this.showOrTruncateDetails();
    },

    expandDetails: function() {
      this.expanded = true;
      this.showOrTruncateDetails();
    },

    contractDetails: function() {
      this.expanded = false;
      this.showOrTruncateDetails();
    },

    enableEditing: function() {
      this.editableBody.val(this.record().body());
      this.editableDetails.val(this.record().details());
      this.content.hide();
      this.editableContent.show();
      this.editableBody.elastic();
      this.editableDetails.elastic();

      this.expandButton.hide();
      this.contractButton.hide();
      this.editButton.hide();
      this.createButton.hide();
      this.cancelButton.show();
      this.updateButton.show();
      this.defer(this.bind(function() {this.editableBody.focus()}));
    },

    enableCreating: function() {
      this.editableBody.val("");
      this.editableDetails.val("");
      this.content.hide();
      this.editableContent.show();
      this.editableDetails.elastic();
      this.editableBody.elastic();
      
      this.editButton.hide();
      this.expandButton.hide();
      this.contractButton.hide();
      this.updateButton.hide();
      this.cancelButton.show();
      this.createButton.show();
      this.defer(this.bind(function() {this.editableBody.focus()}));
    },

    disableEditing: function() {
      this.editableContent.hide();
      this.cancelButton.hide();
      this.updateButton.hide();
      this.createButton.hide();
      this.editButton.show();
      this.content.show();
      this.showOrTruncateDetails();
    },

    updateRecord: function() {
      this.startLoading();
      this.record().update({
        body:    this.editableBody.val(),
        details: this.editableDetails.val()
      }).onSuccess(function() {
        this.stopLoading();
        this.disableEditing();
      }, this);
    },

    createRecord: function() {
      Application.currentOrganization().ensureCurrentUserCanParticipate().
        onSuccess(function() {
          this.containingView.unrankedList.relation().create({
            body:    this.editableBody.val(),
            details: this.editableDetails.val()
          }).onSuccess(function(newRecord) {
            this.containingView.containingColumn.pushState({recordId: newRecord.id()});
            this.disableEditing();
          }, this);
        }, this);
    },

    createComment: function() {
      Application.currentOrganization().ensureCurrentUserCanParticipate().
        onSuccess(function() {
          this.record().comments().create({
            body: this.editableComment.val()
          }).onSuccess(function(newRecord) {
            this.editableComment.val('');
          }, this);
        }, this);
    },

    saveEdits: function() {
      if (this.createButton.is(':visible'))      this.createButton.click();
      else if (this.updateButton.is(':visible')) this.updateButton.click();
    },

    toggleComments: function() {
      if (this.commentsHeader.hasClass('expanded')) {
        this.contractComments();
      } else {
        this.expandComments();
      }
    },

    contractComments: function() {
      this.commentsHeader.removeClass('expanded');
      this.commentsBody.hide();
    },

    expandComments: function() {
      this.commentsHeader.addClass('expanded');
      this.commentsBody.show();
      this.editableComment.focus();
    },

    startLoading: function() {
    },

    stopLoading: function() {
    }
  }
});
