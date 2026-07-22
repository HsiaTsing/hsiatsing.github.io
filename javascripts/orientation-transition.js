(function () {
  "use strict";

  var root = document.documentElement;
  var compactLayout = window.matchMedia("screen and (max-width: 720px)");
  var stackedLayout = window.matchMedia(
    "screen and (max-width: 560px) and (orientation: portrait)"
  );
  var narrowLayout = window.matchMedia("screen and (max-width: 480px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var activeAnimations = [];
  var transitionId = 0;
  var resizeFrame = null;
  var savedGroups = null;
  var savedWrapperRect = null;
  var pendingLayout = false;

  function setLayout() {
    root.classList.toggle("compact-layout", compactLayout.matches);
    root.classList.toggle("profile-stacked", stackedLayout.matches);
    root.classList.toggle("narrow-layout", narrowLayout.matches);
  }

  function layoutIsCurrent() {
    return root.classList.contains("compact-layout") === compactLayout.matches &&
      root.classList.contains("profile-stacked") === stackedLayout.matches &&
      root.classList.contains("narrow-layout") === narrowLayout.matches;
  }

  // Apply the initial responsive layout before the page is painted.
  setLayout();

  function stopActiveAnimations() {
    transitionId += 1;
    activeAnimations.forEach(function (animation) {
      animation.cancel();
    });
    activeAnimations = [];
  }

  function localRect(element, containerRect) {
    var rect = element.getBoundingClientRect();
    return {
      left: rect.left - containerRect.left,
      top: rect.top - containerRect.top,
      width: rect.width
    };
  }

  function captureGroup(container, elements) {
    var containerRect = container.getBoundingClientRect();
    return {
      container: container,
      elements: elements,
      rects: elements.map(function (element) {
        return localRect(element, containerRect);
      })
    };
  }

  function collectGroups() {
    var groups = [];
    var wrapper = document.querySelector(".wrapper");
    var profile = document.querySelector(".profile-section");
    var research = document.querySelector(".research-section");

    if (wrapper) {
      groups.push(captureGroup(
        wrapper,
        Array.prototype.slice.call(wrapper.children)
      ));
    }

    if (profile) {
      groups.push(captureGroup(profile, [
        profile.querySelector(".profile-portrait"),
        profile.querySelector(".profile-links"),
        profile.querySelector(".subwrapper")
      ].filter(Boolean)));
    }

    if (research) {
      groups.push(captureGroup(
        research,
        Array.prototype.slice.call(research.children)
      ));
    }

    Array.prototype.forEach.call(
      document.querySelectorAll(".research-item"),
      function (item) {
        groups.push(captureGroup(item, [
          item.querySelector(".research-figure"),
          item.querySelector(".research-copy")
        ].filter(Boolean)));
      }
    );

    return groups;
  }

  function saveLayoutSnapshot() {
    var wrapper = document.querySelector(".wrapper");
    if (!wrapper || activeAnimations.length) {
      return;
    }
    savedWrapperRect = wrapper.getBoundingClientRect();
    savedGroups = collectGroups();
  }

  function animateGroup(group, duration) {
    var newContainerRect = group.container.getBoundingClientRect();

    group.elements.forEach(function (element, index) {
      var first = group.rects[index];
      var last = localRect(element, newContainerRect);
      var offsetX = first.left - last.left;
      var offsetY = first.top - last.top;
      var scale = 1;

      // The links remain text-aligned to the center while their parent changes
      // width, so track their visual center rather than their left edge.
      if (element.classList.contains("profile-links")) {
        offsetX = (first.left + first.width / 2) -
          (last.left + last.width / 2);
      }

      if (element.classList.contains("research-figure") && last.width > 0) {
        scale = first.width / last.width;
      }

      if (
        Math.abs(offsetX) < 0.5 &&
        Math.abs(offsetY) < 0.5 &&
        Math.abs(scale - 1) < 0.005
      ) {
        return;
      }

      activeAnimations.push(
        element.animate(
          [
            {
              opacity: 0.9,
              transform: "translate(" + offsetX + "px, " + offsetY + "px) scale(" + scale + ")",
              transformOrigin: "top left"
            },
            {
              opacity: 1,
              transform: "translate(0, 0) scale(1)",
              transformOrigin: "top left"
            }
          ],
          {
            duration: duration,
            easing: "cubic-bezier(.22, .68, .3, 1)"
          }
        )
      );
    });
  }

  function animateWrapper(wrapper, firstRect, lastRect, duration) {
    var offsetX = firstRect.left - lastRect.left;
    var offsetY = firstRect.top - lastRect.top;

    if (Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5) {
      return;
    }

    activeAnimations.push(
      wrapper.animate(
        [
          { transform: "translate(" + offsetX + "px, " + offsetY + "px)" },
          { transform: "translate(0, 0)" }
        ],
        {
          duration: duration,
          easing: "cubic-bezier(.22, .68, .3, 1)"
        }
      )
    );
  }

  function handleLayoutChange() {
    if (activeAnimations.length) {
      pendingLayout = true;
      return;
    }

    stopActiveAnimations();

    var wrapper = document.querySelector(".wrapper");
    if (reduceMotion.matches || !wrapper || !wrapper.animate) {
      setLayout();
      savedGroups = null;
      savedWrapperRect = null;
      window.requestAnimationFrame(saveLayoutSnapshot);
      return;
    }

    var wrapperRect = savedWrapperRect || wrapper.getBoundingClientRect();
    var groups = savedGroups || collectGroups();
    var currentTransition = transitionId;
    var duration = 420;

    if (!layoutIsCurrent()) {
      setLayout();
    }
    var newWrapperRect = wrapper.getBoundingClientRect();
    groups.forEach(function (group) {
      animateGroup(group, duration);
    });
    animateWrapper(wrapper, wrapperRect, newWrapperRect, duration);

    if (!activeAnimations.length) {
      saveLayoutSnapshot();
      return;
    }

    Promise.all(activeAnimations.map(function (animation) {
      return animation.finished.catch(function () {});
    })).then(function () {
      if (currentTransition !== transitionId) {
        return;
      }
      activeAnimations = [];
      saveLayoutSnapshot();

      if (pendingLayout || !layoutIsCurrent()) {
        pendingLayout = false;
        window.requestAnimationFrame(handleLayoutChange);
      }
    });
  }

  function scheduleLayoutChange() {
    if (resizeFrame !== null) {
      window.cancelAnimationFrame(resizeFrame);
    }
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = null;
      handleLayoutChange();
    });
  }

  [compactLayout, stackedLayout, narrowLayout].forEach(function (mediaQuery) {
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", scheduleLayoutChange);
    } else {
      mediaQuery.addListener(scheduleLayoutChange);
    }
  });

  window.addEventListener("resize", scheduleLayoutChange);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", saveLayoutSnapshot);
  } else {
    saveLayoutSnapshot();
  }

  window.addEventListener("load", saveLayoutSnapshot);
})();
