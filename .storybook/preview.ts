import type { Preview } from "@storybook/vue3-vite";

import { createI18n } from "vue-i18n";
import { setup } from "@storybook/vue3";
import ui from "@nuxt/ui/vue-plugin";
import "@fontsource-variable/google-sans";

import "../src/renderer/style.css";
import "../src/renderer/shared/ui/styles/index.scss";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en: {
      commandPalette: {
        placeholder: "Type a command or search...",
        back: "Back",
        close: "Close",
        emptySearch: 'No results for "{searchTerm}"',
        empty: "No results found.",
      },
      sidebar: {
        close: "Close sidebar",
        toggle: "Toggle sidebar",
      },
      dashboardSidebar: {
        title: "Sidebar",
        description: "",
      },
      dashboardSidebarToggle: {
        open: "Open sidebar",
        close: "Close sidebar",
      },
      dashboardSidebarCollapse: {
        expand: "Expand sidebar",
        collapse: "Collapse sidebar",
      },
    },
  },
});

setup((app) => {
  app.use(i18n);
  app.use(ui);
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },

  decorators: [
    () => ({
      template: "<UApp><story /></UApp>",
    }),
  ],
};

export default preview;
