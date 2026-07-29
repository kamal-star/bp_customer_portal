import axios from "axios";

// Shared axios instance. Base URL + auth token are set by AuthContext.
const client = axios.create({
  timeout: 20000,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

export function configureClient({ serverUrl, apiKey, apiSecret }) {
  if (serverUrl) client.defaults.baseURL = serverUrl.replace(/\/+$/, "");
  if (apiKey && apiSecret) {
    client.defaults.headers.common.Authorization = `token ${apiKey}:${apiSecret}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

// Frappe wraps whitelisted return values in { message: ... }.
function unwrap(response) {
  return response.data && "message" in response.data ? response.data.message : response.data;
}

export function extractError(err) {
  const data = err.response && err.response.data;
  if (data) {
    if (data._server_messages) {
      try {
        const msgs = JSON.parse(data._server_messages);
        if (msgs.length) {
          const parsed = JSON.parse(msgs[0]);
          return parsed.message || parsed;
        }
      } catch (_) {
        /* fall through */
      }
    }
    if (data.exception) return String(data.exception).replace(/^.*?:\s*/, "");
    if (data.message) return data.message;
  }
  if (err.message === "Network Error") {
    return "Cannot reach the server. Check your connection and the server URL.";
  }
  return err.message || "Something went wrong.";
}

const M = "/api/method/bp_customer_portal.api";

function form(params) {
  const body = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") body.append(k, v);
  });
  return body.toString();
}

export const api = {
  login: (serverUrl, usr, pwd) =>
    axios
      .post(`${serverUrl.replace(/\/+$/, "")}${M}.app_login`, form({ usr, pwd }), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000,
      })
      .then(unwrap),

  getProfile: () => client.get(`${M}.get_profile`).then(unwrap),

  getFormOptions: () => client.get(`${M}.get_form_options`).then(unwrap),

  getDashboard: () => client.get(`${M}.get_dashboard`).then(unwrap),

  getTransactions: (params) => client.get(`${M}.get_transactions`, { params }).then(unwrap),

  getOrders: (params) => client.get(`${M}.get_fuel_orders`, { params }).then(unwrap),

  getOrder: (name) => client.get(`${M}.get_fuel_order`, { params: { name } }).then(unwrap),

  createOrder: (payload) => client.post(`${M}.create_fuel_order`, form(payload)).then(unwrap),

  updateOrder: (payload) => client.post(`${M}.update_fuel_order`, form(payload)).then(unwrap),

  cancelOrder: (name) => client.post(`${M}.cancel_fuel_order`, form({ name })).then(unwrap),
};

export default client;
