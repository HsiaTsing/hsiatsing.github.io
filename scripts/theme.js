(function () {
  "use strict";

  var root = document.documentElement;
  var darkStyles = document.getElementById("dark-theme-styles");
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var activeTransition = null;
  var storageKey = "qing-xia-theme";
  var chosenTheme = null;
  var button = null;

  function validTheme(value) {
    return value === "light" || value === "dark" ? value : null;
  }

  try {
    chosenTheme = validTheme(window.localStorage.getItem(storageKey));
  } catch (error) {
    // The toggle still works when browser storage is unavailable.
  }

  function selectedTheme() {
    return chosenTheme || (systemTheme.matches ? "dark" : "light");
  }

  function commitTheme(theme) {
    var dark = theme === "dark";
    root.setAttribute("data-theme", theme);
    darkStyles.media = dark ? "screen" : "not all";
    if (themeColor) {
      themeColor.setAttribute("content", dark ? "#12171d" : "#f0f0f0");
    }
    if (button) {
      var label = dark ? "Switch to light theme" : "Switch to dark theme";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(dark));
    }
  }

  function paletteReady(theme) {
    if (theme !== "dark" || darkStyles.sheet) {
      return;
    }
    // A first toggle can happen while the initially inactive stylesheet loads.
    return new Promise(function (resolve) {
      var timer = window.setTimeout(finish, 1000);
      function finish() {
        window.clearTimeout(timer);
        darkStyles.removeEventListener("load", finish);
        darkStyles.removeEventListener("error", finish);
        resolve();
      }
      darkStyles.addEventListener("load", finish);
      darkStyles.addEventListener("error", finish);
    });
  }

  function applyTheme(animate) {
    if (activeTransition) {
      // Finish the pending DOM update first; then apply the latest choice.
      activeTransition.skipTransition();
      return;
    }
    var theme = selectedTheme();
    if (!animate || reduceMotion.matches ||
        typeof document.startViewTransition !== "function" ||
        root.getAttribute("data-theme") === theme) {
      commitTheme(theme);
      return;
    }

    root.classList.add("theme-snapshot-transition");
    try {
      var transition = document.startViewTransition(function () {
        // Read the latest choice so clicks before snapshot capture coalesce.
        var nextTheme = selectedTheme();
        commitTheme(nextTheme);
        return paletteReady(nextTheme);
      });
      activeTransition = transition;
      transition.ready.catch(function () {
        // Skipping an interrupted transition rejects ready, not the update.
      });
      function finishTransition() {
        if (activeTransition !== transition) {
          return;
        }
        activeTransition = null;
        root.classList.remove("theme-snapshot-transition");
        if (root.getAttribute("data-theme") !== selectedTheme()) {
          applyTheme(true);
        }
      }
      transition.finished.then(finishTransition, finishTransition);
    } catch (error) {
      root.classList.remove("theme-snapshot-transition");
      commitTheme(selectedTheme());
    }
  }

  // Run in the head so a saved preference applies before the first paint.
  applyTheme();

  function connectToggle() {
    button = document.getElementById("theme-toggle");
    if (!button) {
      return;
    }
    applyTheme();
    button.hidden = false;
    button.addEventListener("click", function () {
      chosenTheme = selectedTheme() === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(storageKey, chosenTheme);
      } catch (error) {
        // Keep the in-memory choice for the rest of this visit.
      }
      applyTheme(true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectToggle);
  } else {
    connectToggle();
  }

  function followSystemTheme() {
    if (!chosenTheme) {
      applyTheme(true);
    }
  }
  if (systemTheme.addEventListener) {
    systemTheme.addEventListener("change", followSystemTheme);
  } else {
    systemTheme.addListener(followSystemTheme);
  }

  window.addEventListener("storage", function (event) {
    if (event.key === storageKey || event.key === null) {
      chosenTheme = validTheme(event.newValue);
      applyTheme(true);
    }
  });
}());
