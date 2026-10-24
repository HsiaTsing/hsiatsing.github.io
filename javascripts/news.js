(function () {
  "use strict";

  var visibleNewsCount = 10;

  function foldOlderNews() {
    var newsList = document.querySelector(".news-list");

    if (!newsList) {
      return;
    }

    var newsItems = Array.prototype.filter.call(newsList.children, function (item) {
      return item.classList.contains("news-item");
    });

    if (newsItems.length <= visibleNewsCount) {
      return;
    }

    var toggle = document.createElement("button");
    var content = document.createElement("div");
    var lastVisibleItem = newsItems[visibleNewsCount - 1];
    var olderCount = newsItems.length - visibleNewsCount;

    toggle.type = "button";
    toggle.className = "news-toggle";
    toggle.setAttribute("aria-controls", "older-news");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Show " + olderCount + " older news items");
    toggle.title = "Show older news";
    content.id = "older-news";
    content.className = "news-more-content";
    content.hidden = true;

    newsItems.slice(visibleNewsCount).forEach(function (item) {
      content.appendChild(item);
    });

    lastVisibleItem.classList.add("news-item-toggle");
    lastVisibleItem.appendChild(toggle);
    newsList.appendChild(content);

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") !== "true";
      content.hidden = !expanded;
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", expanded ? "Hide older news items" :
        "Show " + olderCount + " older news items");
      toggle.title = expanded ? "Hide older news" : "Show older news";
      window.dispatchEvent(new Event("newstoggle"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", foldOlderNews);
  } else {
    foldOlderNews();
  }
}());
