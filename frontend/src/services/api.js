const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("ewb_token");
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// ─── Auth ──────────────────────────────────────────────────

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register({ name, email, password, state }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      state,
      department: "GST Intelligence",
    }),
  });
}

export function getProfile() {
  return request("/auth/profile");
}

export function getPendingRegistrations() {
  return request("/auth/pending");
}

export function approveUser(id) {
  return request(`/auth/approve/${id}`, { method: "PATCH" });
}

export function getAllOfficers() {
  return request("/auth/officers");
}

// ─── E-Way Bills ───────────────────────────────────────────

export function uploadExcel(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/ewb/upload", {
    method: "POST",
    body: formData,
  });
}

export function getAllBills({ page = 1, limit = 50, suspicious, state, district } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (suspicious !== undefined && suspicious !== "") params.set("suspicious", suspicious);
  if (state) params.set("state", state);
  if (district) params.set("district", district);
  return request(`/ewb?${params.toString()}`);
}

export function getBillById(id) {
  return request(`/ewb/${id}`);
}

export function getStats({ state, district } = {}) {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (district) params.set("district", district);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return request(`/ewb/stats${queryStr}`);
}

export function getStates() {
  return request("/ewb/states");
}

export function getDistricts(state) {
  const query = state ? `?state=${encodeURIComponent(state)}` : "";
  return request(`/ewb/districts${query}`);
}

export function deleteAllBills() {
  return request("/ewb", { method: "DELETE" });
}

