import { DefaultLayout } from "@renderer/layouts";
import { HomeScreen, SettingsScreen } from "@renderer/screens";
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: DefaultLayout,
      children: [
        {
          path: "",
          name: "home",
          component: HomeScreen,
        },
        {
          path: "/settings",
          name: "settings",
          component: SettingsScreen,
        },
      ],
    },
  ],
});

export default router;
