import type { Preview } from "@storybook/vue3-vite";

import { createI18n } from "vue-i18n";
import { setup } from "@storybook/vue3";
import "@fontsource-variable/google-sans";
import "@unocss/reset/tailwind.css";
import "uno.css";

import "../src/style.css";
import "../src/shared/ui/styles/index.scss";
import App from "../src/shared/ui/app/app.vue";

const i18n = createI18n({});

setup((app) => {
  app.use(i18n);
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
      components: { App },
      template: "<App><story /></App>",
    }),
  ],
};

export default preview;
