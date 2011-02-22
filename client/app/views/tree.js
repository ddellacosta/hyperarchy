_.constructor("Views.Tree", View.Template, {
  content: function() { with(this.builder) {
    div({id: "tree"}, function() {

      div({id: "leftColumn", 'class': "column"}, function() {
        h2().ref("leftColumnTitle");
      }).ref("leftColumn");

      div({id: "rightColumn", 'class': "column"}, function() {
        subview('rightRelationList', Views.SortedList, {
          rootAttributes: {id: "rightRelationList"},
          buildElement: function(record) {
            return record.body();
          }
        });
      }).ref("rightColumn");

    });
  }},

  viewProperties: {
    viewName: 'tree',

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle();
    },

    navigate: function(state) {
      this.parseState(state);
      this.fetchLeftRecord();
      this.fetchRightRelations();

      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.hideSubNavigationContent();
    },

    fetchLeftRecord: function() {
      this.leftTable.findOrFetch(this.leftId).
        onSuccess(function(record) {
          this.leftRecord(record);
        }, this);
    },

    fetchRightRelations: function() {
      _(this.childTables[this.leftTableName]).each(function(childTable) {
        var relation = this.leftTable.where({id: this.leftId}).joinThrough(childTable);
        relation.fetch().onSuccess(function() {
          if (childTable === this.rightTable) {
            this.rightRelation(relation);
          }
        }, this);
      }, this);
    },

    leftRecord: {
      afterChange: function(record) {
        Application.currentOrganizationId(record.organizationId());
        this.populateLeftColumn();
      }
    },

    rightRelation: {
      afterChange: function() {
        this.populateRightColumn();
      }
    },

    populateLeftColumn: function() {
      this.leftColumnTitle.bindHtml(this.leftRecord(), "body");
    },

    populateRightColumn: function() {
      this.rightRelationList.relation(this.rightRelation());
    },

    parseState: function(state) {
      this.leftId  = parseInt(state.leftId);
      this.rightId = parseInt(state.rightId);
      this.leftTableName  = _(_((state.left)).camelize()).singularize();
      this.rightTableName = _(_((state.right)).camelize()).singularize();
      this.leftTable  = this.leftTables[this.leftTableName];
      this.rightTable = this.childTables[this.leftTableName][this.rightTableName];

      if (!this.leftTable || !this.rightTable) {
        // take some corrective action here
        console.debug("invalid hash fragment");
      }
    },

    leftTables: {
      "Organization": Organization,
      "Election":     Election,
      "Candidate":    Candidate
    },

    childTables: {
      "Organization": {
        "Election": Election
      },
      "Election": {
        "Candidate": Candidate,
        "Comment":   ElectionComment
      },
      "Candidate": {
        "Comment":   CandidateComment
      }
    }
  }
});
