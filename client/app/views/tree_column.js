_.constructor("Views.TreeColumn", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "column"}, function() {


    });
  }},

  viewProperties: {

    initialize: function() {

    },

    state: {
      afterChange: function(state) {
        state.relation.fetch().onSuccess(function() {
//          this[state.]
        });
      }
    },


//    fetchData: function() {
//      this.parentTable.findOrFetch(this.parentId).
//        onSuccess(function(record) {
//          this.parentRecord(record);
//        }, this);
//    },
//
//    fetchChildren: function() {
//      _(this.childTables[this.parentTableName]).each(function(childTable) {
//        var relation = this.parentTable.where({id: this.parentId}).joinThrough(childTable);
//        relation.fetch().onSuccess(function() {
//          if (childTable === this.childTable) {
//            this.childRelation(relation);
//          }
//        }, this);
//      }, this);
//    },
//
//    parentRecord: {
//      afterChange: function(record) {
//        this.setCurrentOrganization();
//        this.populateLeftColumn();
//      }
//    },
//
//    childRelation: {
//      afterChange: function() {
//        this.populateRightColumn();
//      }
//    },

    setCurrentOrganization: function() {
      if (this.tables[0] == Organization) {
        Application.currentOrganizationId(this.ids[0]);
      } else {
        this.tables[0].findOrFetch(this.ids[0]).onSuccess(function(record) {
          Application.currentOrganizationId(record.organizationId());
        });
      }
    },

//    populateLeftColumn: function() {
//      this.parentTitle.bindHtml(this.parentRecord(), "body");
//    },
//
//    populateRightColumn: function() {
//      this.childList.relation(this.childRelation());
//    },

    parseState: function(state) {
      var parentTableName;
      for (var i = 0; i < this.MAXCOLUMNS; i++) {
        this.tableNames[i] = _state["table" + i];
        this.ids[i]        = parseInt(state["id" + i]);
        parentTableName    = this.tableNames[i-1] || "root";
        this.tables[i]     = this.childTablesByName[parentTableName][this.tableNames[i]];
        if (!this.tables[i] || !this.ids[i]) {
          break;
        }
      }
      this.numColumns = i + 1;

      console.debug(this.numColumns);

      if (this.numColumns < 2) {
        // take some corrective action here
        console.debug("invalid hash fragment");
      }
    },

    childTablesByName: {
      "root" : {
        "organizations": Organization,
        "elections":     Election,
        "candidates":    Candidate
      },

      "organizations": {
        "elections": Election
      },

      "elections": {
        "candidates": Candidate,
        "comments":   ElectionComment
      },

      "candidates": {
        "comments":   CandidateComment
      }
    }
  }
});
