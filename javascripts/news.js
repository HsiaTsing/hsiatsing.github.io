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
    var expanded = false;
    var animation = null;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    toggle.type = "button";
    toggle.className = "news-toggle";
    toggle.setAttribute("aria-controls", "older-news");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Show " + olderCount + " older news items");
    toggle.title = "Show older news";
    content.id = "older-news";
    content.className = "news-more-content";
    content.hidden = true;
    content.inert = true;
    content.setAttribute("aria-hidden", "true");

    newsItems.slice(visibleNewsCount).forEach(function (item) {
      content.appendChild(item);
    });

    lastVisibleItem.classList.add("news-item-toggle");
    lastVisibleItem.appendChild(toggle);
    newsList.appendChild(content);

    function finishTransition() {
      if (animation) {
        animation.cancel();
        animation = null;
      }
      content.hidden = !expanded;
      content.style.overflow = "";
      window.dispatchEvent(new Event("newstoggle"));
    }

    function setExpanded(nextExpanded) {
      // Capture the current frame before cancelling a previous transition.
      var startHeight = content.hidden ? 0 : content.getBoundingClientRect().height;
      var startOpacity = content.hidden ? 0 : parseFloat(window.getComputedStyle(content).opacity);
      var returnFocus = !nextExpanded && content.contains(document.activeElement);
      if (animation) {
        animation.cancel();
        animation = null;
      }

      expanded = nextExpanded;
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", expanded ? "Hide older news items" :
        "Show " + olderCount + " older news items");
      toggle.title = expanded ? "Hide older news" : "Show older news";
      content.inert = !expanded;
      content.setAttribute("aria-hidden", String(!expanded));
      if (returnFocus) {
        toggle.focus({ preventScroll: true });
      }

      if (reduceMotion.matches || !content.animate) {
        finishTransition();
        return;
      }

      content.hidden = false;
      content.style.overflow = "hidden";
      var nextAnimation = content.animate([
        { height: startHeight + "px", opacity: startOpacity },
        { height: (expanded ? content.scrollHeight : 0) + "px", opacity: expanded ? 1 : 0 }
      ], {
        duration: 420,
        easing: "cubic-bezier(.4, 0, .2, 1)",
        fill: "both"
      });
      animation = nextAnimation;
      nextAnimation.finished.then(function () {
        if (animation === nextAnimation) {
          finishTransition();
        }
      }, function () {
        // Reversing a transition cancels its previous animation.
      });
    }

    function settleIfAnimating() {
      if (animation) {
        finishTransition();
      }
    }

    toggle.addEventListener("click", function () {
      setExpanded(!expanded);
    });

    window.addEventListener("resize", settleIfAnimating);
    window.addEventListener("beforeprint", settleIfAnimating);
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", settleIfAnimating);
    } else if (reduceMotion.addListener) {
      reduceMotion.addListener(settleIfAnimating);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(settleIfAnimating);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", foldOlderNews);
  } else {
    foldOlderNews();
  }
}());
