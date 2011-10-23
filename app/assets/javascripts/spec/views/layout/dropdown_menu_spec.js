//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Views.Layout.DropdownMenu", function() {
  var dropdownMenu;
  beforeEach(function() {
    renderLayout();
    Application.currentUser(User.created({id: 1, firstName: "Some", lastName: "Guy"}));
    dropdownMenu = Application.accountMenu.dropdownMenu
  });

  it("shows the dropdown menu and adds the 'active' class to the link when it is clicked, then hides the menu and removes the class when the user clicks again anywhere", function() {
    clickDropdownLink();

    runs(function() {
      expect(dropdownMenu.menu).toBeVisible();
      expect(dropdownMenu).toHaveClass('active');
      $(window).click();
      expect(dropdownMenu.menu).toBeHidden();
      expect(dropdownMenu).not.toHaveClass('active');
    });
  });

  it("hides the menu when the user clicks the dropdown link again, but allows it to be opened with the next click", function() {
    clickDropdownLink();

    runs(function() {
      expect(dropdownMenu.menu).toBeVisible();
    });

    clickDropdownLink();

    runs(function() {
      expect(dropdownMenu.menu).toBeHidden();
    });

    clickDropdownLink();

    runs(function() {
      expect(dropdownMenu.menu).toBeVisible();
    });
  });

  // simulates bubbling to window
  function clickDropdownLink() {
    runs(function() {
      dropdownMenu.link.click();
      $(window).click();
    });
    waits();
  }
});
