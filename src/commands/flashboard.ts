import { IDENTIFIER } from "../extension";

interface Config {
  enabled?: boolean;
}

const original = {
  header: {
    paddingTop: "16px",
    paddingBottom: "16px",
  },
  grid: { padding: "20px" },
};

const updated = {
  header: {
    paddingTop: "4px",
    paddingBottom: "10px",
  },
  grid: { padding: "5px" },
};

aha.on("flashboard", ({ record }, { identifier, settings }) => {});

aha.on({ event: "aha.extensions.ready" }, () => {
  initialize();
  setTimeout(() => initialize(), 1000);
  setTimeout(() => initialize(), 2000);
  setTimeout(() => initialize(), 3000);
});

aha.on({ event: "aha.extensions.reloaded" }, () => {
  initialize();
});

async function initialize() {
  if (!isDashboard()) return;

  const enabled = await isEnabled();
  if (enabled) {
    modify();
  }

  addToView({ enabled });
}

function isDashboard() {
  return (
    document.querySelectorAll('[data-react-class="Dashboards"]').length > 0
  );
}

function bookmarkId() {
  if (!isDashboard()) return;
  const el = document.querySelector("[data-current-bookmark-id]");
  if (!el) return;
  return el.getAttribute("data-current-bookmark-id");
}

function getUser() {
  return (aha as any).user as Aha.User;
}

async function getBookmarkConfig(): Promise<Config> {
  if (!isDashboard()) return null;

  const config = await getUser().getExtensionField(
    IDENTIFIER,
    String(bookmarkId())
  );

  return config || {};
}

async function isEnabled() {
  if (!isDashboard()) return false;

  const config = await getBookmarkConfig();
  return config.enabled;
}

async function setEnabled(enable: boolean) {
  addToView({ enabled: enable });

  if (enable) {
    modify();
  } else {
    unmodify();
  }

  const config = await getBookmarkConfig();
  config.enabled = enable;
  await getUser().setExtensionField(IDENTIFIER, String(bookmarkId()), config);
}

function addToView({ enabled }: { enabled: boolean }) {
  const host = document.querySelector("#page-nav .report-header");
  host.querySelectorAll(".flashboard").forEach((oldEl) => oldEl.remove());

  const container = document.createElement("div");
  container.className = "flashboard";

  const button = document.createElement("aha-button");
  button.setAttribute("type", "primary");

  if (enabled) {
    button.innerText = "Disable Flashboard";
    button.addEventListener("click", () => setEnabled(false));
  } else {
    button.innerText = "Enable Flashboard";
    button.setAttribute("outline", "outline");
    button.addEventListener("click", () => setEnabled(true));
  }

  container.appendChild(button);
  host.appendChild(container);
}

function updateStyleWith(
  element: HTMLElement,
  newStyle: Partial<CSSStyleDeclaration>
) {
  Object.keys(newStyle).forEach((key) => {
    element.style[key] = newStyle[key];
  });
}

function modify() {
  try {
    updateStyleWith(document.getElementById("page-nav"), updated.header);

    document
      .getElementsByClassName("dashboard-rendered-filters")
      .item(0).parentElement.style.display = "none";

    document
      .getElementsByClassName("report-type-description")
      .item(0).parentElement.parentElement.style.display = "none";

    const workspace = document.getElementById("workspace-content");
    workspace
      .querySelectorAll('[class^="Dashboards--"]')
      .forEach(
        (dash: HTMLElement) => (dash.style.padding = updated.grid.padding)
      );

    const grid = document.getElementById("Dashboard-Grid");
    const style = grid.getAttribute("style");
    grid.setAttribute(
      "style",
      style.replaceAll(original.grid.padding, updated.grid.padding)
    );
  } catch (err) {
    console.log("flashboard failed, retrying");
    setTimeout(modify, 500);
  }
}

function unmodify() {
  updateStyleWith(document.getElementById("page-nav"), original.header);

  document
    .getElementsByClassName("dashboard-rendered-filters")
    .item(0).parentElement.style.display = null;

  document
    .getElementsByClassName("report-type-description")
    .item(0).parentElement.parentElement.style.display = null;

  const workspace = document.getElementById("workspace-content");
  workspace
    .querySelectorAll('[class^="Dashboards--"]')
    .forEach((dash: HTMLElement) => {
      dash.style.padding = original.grid.padding;
    });

  const grid = document.getElementById("Dashboard-Grid");
  const style = grid.getAttribute("style");
  grid.setAttribute(
    "style",
    style.replaceAll(updated.grid.padding, original.grid.padding)
  );
}
