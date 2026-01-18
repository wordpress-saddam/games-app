exports.generateWidgetScript = ({ url, width, height, border }) => {
  return `
    (function() {
      // ---- Configurable iframe parameters ----
      var gameUrl = "${url}";
      var iframeWidth = "${width}";
      var iframeHeight = "${height}";
      var iframeBorder = "${border}";

      // ---- Prevent duplicate injection ----
      if (document.getElementById("sortd-games-widget")) return;

      // ---- Create iframe container ----
      var container = document.createElement("div");
      container.id = "sortd-games-widget";
      container.style.position = "relative";
      container.style.width = iframeWidth;
      container.style.height = iframeHeight;
      container.style.margin = "20px 0";

      // ---- Create iframe ----
      var iframe = document.createElement("iframe");
      iframe.src = gameUrl;
      iframe.width = "100%";
      iframe.height = "100%";
      iframe.style.border = iframeBorder;
      iframe.allowFullscreen = true;
      iframe.setAttribute("loading", "lazy"); // improve perf

      // ---- Append ----
      container.appendChild(iframe);
      document.body.appendChild(container);
    })();
  `;
};
