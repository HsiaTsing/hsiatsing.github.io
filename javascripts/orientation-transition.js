(function () {
  "use strict";

  var root = document.documentElement;
  var stackedLayout = window.matchMedia(
    "screen and (max-width: 560px) and (orientation: portrait)"
  );
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var activeTransition = null;

  function setLayout(stacked) {
    root.classList.toggle("profile-stacked", stacked);
  }

  // Set the correct layout before the page is painted.
  setLayout(stackedLayout.matches);

  function handleLayoutChange(event) {
    var stacked = event.matches;

    if (activeTransition && activeTransition.skipTransition) {
      activeTransition.skipTransition();
    }

    if (reduceMotion.matches || !document.startViewTransition) {
      setLayout(stacked);

      var wrapper = document.querySelector(".wrapper");
      if (!reduceMotion.matches && wrapper && wrapper.animate) {
        wrapper.animate(
          [
            { opacity: 0.82, transform: "scale(0.992)" },
            { opacity: 1, transform: "scale(1)" }
          ],
          { duration: 320, easing: "cubic-bezier(.22, 1, .36, 1)" }
        );
      }
      return;
    }

    activeTransition = document.startViewTransition(function () {
      setLayout(stacked);
    });

    activeTransition.finished.finally(function () {
      activeTransition = null;
    });
  }

  if (stackedLayout.addEventListener) {
    stackedLayout.addEventListener("change", handleLayoutChange);
  } else {
    stackedLayout.addListener(handleLayoutChange);
  }
})();
