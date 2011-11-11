//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Views.Components.SortedList", function() {
  var view, relation, relation2;

  beforeEach(function() {
    view = Views.Components.SortedList.toView({
      buildElement: function(answer) {
        return $("<li>" + answer.body() + "</li>");
      }
    });

    var question = Question.created({id: 1, body: "What's your favorite color?"});
    relation = question.answers();
    relation.created({id: 1, body: "Red", position: 1});
    relation.created({id: 2, body: "Green", position: 3});
    relation.created({id: 3, body: "Blue", position: 5});

    var question2 = Question.created({id: 2, body: "What's your favorite type of car?"});
    relation2 = question2.answers();

    console.log(relation2.predicate);

    relation2.created({id: 4, body: "Audi", position: 1});
    relation2.created({id: 5, body: "Volvo", position: 3});
    relation2.created({id: 6, body: "Mercedes", position: 5});

    view.relation(relation);
  });

  describe("when a relation is assigned", function() {
    it("unsubscribes from any previous relation and populates the list with elements based on the new relation", function() {
      console.log(relation.map(function(r) { return r.fieldValues() }));
      expect(relation.size()).toBe(3);

      expect(view.find('li').length).toBe(3);
      expect(view.find("li:eq(0)").html()).toBe("Red");
      expect(view.find("li:eq(1)").html()).toBe("Green");
      expect(view.find("li:eq(2)").html()).toBe("Blue");

      expect(relation2.hasSubscriptions()).toBeFalsy();
      view.relation(relation2);

      expect(relation.hasSubscriptions()).toBeFalsy();
      expect(relation2.hasSubscriptions()).toBeTruthy();

      expect(view.find('li').length).toBe(3);
      expect(view.find("li:eq(0)").html()).toBe("Audi");
      expect(view.find("li:eq(1)").html()).toBe("Volvo");
      expect(view.find("li:eq(2)").html()).toBe("Mercedes");
    });
  });

  describe("when a null relation is assigned", function() {
    it("unsubscribes from a previous relation and empties the list", function() {
      expect(view.find('li').length).toBe(3);
      expect(relation.hasSubscriptions()).toBeTruthy();

      view.relation(null);

      expect(view.find('li')).not.toExist();
      expect(relation.hasSubscriptions()).toBeFalsy();
    });
  });

  describe("when a record is inserted into the relation", function() {
    it("inserts an li for the record at the appropriate index", function() {
      relation.created({id: "yellow", body: "Yellow", position: 4});
      expect(view.find("li:eq(2)").html()).toBe("Yellow");
      expect(view.find("li:eq(3)").html()).toBe("Blue");
    });
  });

  describe("when a record is removed from the relation", function() {
    it("removes the li corresponding to the record and removes it from the elementsById hash", function() {
      var record = relation.first();
      record.destroyed();
      expect(view.find('li').length).toBe(2);
      expect(view).not.toContain("li:contains('Red')");
      expect(view.elementsById[record.id()]).toBeUndefined();
    });
  });

  describe("when the position of a record is updated in the relation", function() {
    it("moves the li corresponding to the record to the appropriate location", function() {
      var record = relation.first();
      record.updated({position: 4});
      expect(view.find("li").length).toBe(3);
      expect(view.find("li:eq(1)").html()).toBe("Red");
      record.updated({position: 6});
      expect(view.find("li:eq(2)").html()).toBe("Red");
    });
  });

  describe("#remove", function() {
    beforeEach(function() {
      $("#testContent").append(view);
    });

    afterEach(function() {
      $("#testContent").empty();
    });

    it("unsubscribes from the relation after removing itself from the dom", function() {
      expect(relation.hasSubscriptions()).toBeTruthy();
      view.remove();
      expect($("#testContent")).not.toContain('ol');
      expect(relation.hasSubscriptions()).toBeFalsy();
    });
  });
});
