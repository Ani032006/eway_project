const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("ewb_token");
  const headers = { ...options.headers };

  if (token && token !== "immediate_access_token") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Start the backend from the frontend folder: npm run dev:api (or npm run dev). Also ensure MongoDB is running."
    );
  }

  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned an invalid response (${res.status}). Check that the API is running on port 5000.`
      );
    }
  }

  if (!res.ok) {
    const err = new Error(
      data?.error ||
        (res.status === 502 || res.status === 504
          ? "API server is not running. Run: cd frontend && npm run dev:api"
          : `Request failed (${res.status})`)
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data ?? {};
}

// ─── Auth ──────────────────────────────────────────────────

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register({ name, email, password, state, department }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, state, department }),
  });
}

export function sendOtp(email) {
  return request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email, otp) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export function forgotPassword(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword({ token, email, password }) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, email, password }),
  });
}

export function changePassword({ currentPassword, newPassword }) {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
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

export function logout() {
  localStorage.removeItem("ewb_token");
  localStorage.removeItem("ewb_user");
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
