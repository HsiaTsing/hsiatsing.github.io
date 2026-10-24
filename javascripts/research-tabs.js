(function () {
  "use strict";

  var section = document.querySelector(".research-section");
  var tabList = section && section.querySelector(".research-tabs");
  if (!tabList) {
    return;
  }

  var tabs = Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (tab) {
    return document.getElementById(tab.getAttribute("aria-controls"));
  });
  var textMeasure = document.createElement("canvas").getContext("2d");
  var labelFrame = null;

  function measureLabel(text, fontSize, fontFamily, bold) {
    textMeasure.font = (bold === false ? "normal " : "bold ") +
      fontSize + "px " + fontFamily;
    var fullWidth = textMeasure.measureText(text).width;
    var best = { lines: [text], width: fullWidth };
    var words = text.split(/\s+/);

    for (var index = 1; index < words.length; index += 1) {
      var first = words.slice(0, index).join(" ");
      var second = words.slice(index).join(" ");
      var width = Math.max(
        textMeasure.measureText(first).width,
        textMeasure.measureText(second).width
      );
      if (width < best.width) {
        best = { lines: [first, second], width: width };
      }
    }

    return { fullWidth: fullWidth, split: best };
  }

  function fitTabLabels() {
    if (!textMeasure || !tabList.clientWidth) {
      return;
    }

    var fontSize = 16;
    var availableWidth = tabList.clientWidth;
    var paddingTotal = 0;
    var textTotal = 0;
    var fullTotal = 0;
    var selectedExtra = 0;
    var measurements = tabs.map(function (tab) {
      var style = window.getComputedStyle(tab);
      var padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      var text = tab.getAttribute("data-label");
      var measured = measureLabel(text, fontSize, style.fontFamily);
      var normalWidth = measureLabel(text, fontSize, style.fontFamily, false).fullWidth;
      paddingTotal += padding;
      textTotal += measured.split.width;
      fullTotal += normalWidth + padding + 1;
      selectedExtra = Math.max(selectedExtra, measured.fullWidth - normalWidth);
      return { text: text, family: style.fontFamily, padding: padding, measured: measured };
    });
    // Leave a little breathing room before wrapping, independently of panel layout.
    var singleLineReserve = 24;
    var singleLine = fullTotal + selectedExtra + singleLineReserve <= availableWidth;

    // Keep the normal size while two lines fit; only then reduce the shared size.
    if (textTotal + paddingTotal + tabs.length > availableWidth) {
      fontSize = Math.max(1, Math.floor(
        16 * (availableWidth - paddingTotal - tabs.length) / textTotal * 10
      ) / 10);
    }

    var widths = measurements.map(function (item, index) {
      item.measured = measureLabel(item.text, fontSize, item.family);
      var normalWidth = measureLabel(item.text, fontSize, item.family, false).fullWidth;
      var fullWidth = tabs[index].getAttribute("aria-selected") === "true" ?
        item.measured.fullWidth : normalWidth;
      return (singleLine ? fullWidth : item.measured.split.width) + item.padding + 1;
    });
    var requiredWidth = widths.reduce(function (sum, width) { return sum + width; }, 0);
    var extra = Math.max(0, (availableWidth - requiredWidth) / tabs.length);
    tabList.style.gridTemplateColumns = widths.map(function (width) {
      return (width + extra) + "px";
    }).join(" ");

    tabs.forEach(function (tab, index) {
      var item = measurements[index];
      var lines = singleLine ? [item.text] : item.measured.split.lines;
      var label = tab.querySelector(".research-tab-label");
      tab.style.fontSize = fontSize + "px";
      label.textContent = "";
      lines.forEach(function (line, lineIndex) {
        var span = document.createElement("span");
        span.className = "research-tab-line";
        span.textContent = line + (lineIndex < lines.length - 1 ? " " : "");
        label.appendChild(span);
      });
    });
  }

  function scheduleLabelLayout() {
    if (labelFrame !== null) {
      window.cancelAnimationFrame(labelFrame);
    }
    labelFrame = window.requestAnimationFrame(function () {
      labelFrame = null;
      fitTabLabels();
    });
  }

  function selectTab(index, moveFocus) {
    tabs.forEach(function (tab, tabIndex) {
      var selected = tabIndex === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
    });

    fitTabLabels();

    if (moveFocus) {
      tabs[index].focus({ preventScroll: true });
    }

    // Refresh the existing orientation animation's cached layout after switching.
    if (moveFocus) {
      window.dispatchEvent(new Event("researchtabchange"));
    }
  }

  tabs.forEach(function (tab, index) {
    var label = document.createElement("span");
    label.className = "research-tab-label";
    label.textContent = tab.textContent;
    tab.setAttribute("data-label", label.textContent);
    tab.setAttribute("aria-label", tab.getAttribute("title") || label.textContent);
    tab.textContent = "";
    tab.appendChild(label);

    tab.addEventListener("click", function () {
      selectTab(index, true);
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index + tabs.length - 1) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      selectTab(nextIndex, true);
    });
  });

  selectTab(0, false);
  section.classList.add("research-tabs-enabled");
  tabList.hidden = false;
  scheduleLabelLayout();
  window.addEventListener("resize", fitTabLabels);
  window.addEventListener("load", scheduleLabelLayout);

  // Web fonts can arrive after the first label measurement.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      fitTabLabels();
      window.dispatchEvent(new Event("researchtabchange"));
    });
  }

  if (window.ResizeObserver) {
    var observedWidth = null;
    var labelObserver = new ResizeObserver(function (entries) {
      var width = entries[0].contentRect.width;
      if (width !== observedWidth) {
        observedWidth = width;
        fitTabLabels();
      }
    });
    labelObserver.observe(tabList);
  }
}());
