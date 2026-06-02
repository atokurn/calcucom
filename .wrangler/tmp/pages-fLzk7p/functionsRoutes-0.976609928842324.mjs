import { onRequestGet as __api_auth_callback_js_onRequestGet } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/auth/callback.js"
import { onRequestGet as __api_auth_google_js_onRequestGet } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/auth/google.js"
import { onRequestGet as __api_auth_logout_js_onRequestGet } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/auth/logout.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/auth/logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/auth/me.js"
import { onRequestGet as __api_sync_pull_js_onRequestGet } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/sync/pull.js"
import { onRequestPost as __api_sync_push_js_onRequestPost } from "/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom/functions/api/sync/push.js"

export const routes = [
    {
      routePath: "/api/auth/callback",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_callback_js_onRequestGet],
    },
  {
      routePath: "/api/auth/google",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_google_js_onRequestGet],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestGet],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/sync/pull",
      mountPath: "/api/sync",
      method: "GET",
      middlewares: [],
      modules: [__api_sync_pull_js_onRequestGet],
    },
  {
      routePath: "/api/sync/push",
      mountPath: "/api/sync",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_push_js_onRequestPost],
    },
  ]