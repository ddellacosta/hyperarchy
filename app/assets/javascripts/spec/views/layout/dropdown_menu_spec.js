describe("Views.Layout.DropdownMenu", function() {
  var dropdownMenu;
  beforeEach(function() {
    dropdownMenu = Views.Layout.DropdownMenu.toView({
      linkContent: function() {
        return "Open Dropdown...";
      },
      menuContent: function() {
        this.builder.li("Item 1");
        this.builder.li("Item 2");
      }
    });
    $('#jasmine_content').html(dropdownMenu);
  });

  it("shows the dropdown menu when it is clicked, then hides it when the user clicks again anywhere", function() {
    clickDropdownLink();

    runs(function() {
      expect(dropdownMenu.menu).toBeVisible();
      $(window).click();
      expect(dropdownMenu.menu).toBeHidden();
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