import "@unocss/reset/tailwind-v4.css";
import "virtual:uno.css";
import "./assets/main.css";

import { createApp } from "vue";
import ui from "@nuxt/ui/vue-plugin";

import App from "./App.vue";
import "./services/Logger";

const app = createApp(App);

app.use(ui);

app.mount("#app");
