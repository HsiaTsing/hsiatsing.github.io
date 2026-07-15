(function () {
  "use strict";

  var visibleNewsCount = 12;

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

    var details = document.createElement("details");
    var summary = document.createElement("summary");
    var label = document.createElement("span");
    var content = document.createElement("div");

    details.className = "news-more";
    label.textContent = "More";
    content.className = "news-more-content";

    summary.appendChild(label);
    details.appendChild(summary);
    details.appendChild(content);

    newsItems.slice(visibleNewsCount).forEach(function (item) {
      content.appendChild(item);
    });

    newsList.appendChild(details);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", foldOlderNews);
  } else {
    foldOlderNews();
  }
}());
