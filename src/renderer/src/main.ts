import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { createFsProviderPlugin } from "./plugins/fs-provider";
import "./services/Logger";
import "./styles/main.scss";

const app = createApp(App);

app.use(createPinia());
app.use(createFsProviderPlugin());

app.mount("#app");
