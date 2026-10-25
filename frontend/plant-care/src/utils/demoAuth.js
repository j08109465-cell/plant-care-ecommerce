import { apiRequest } from "./api";

const AUTH_API = "/auth";
let currentUser = null;

const cacheUser = (user) => {
  const userChanged = currentUser?.id !== user.id ||
    currentUser?.email !== user.email ||
    currentUser?.name !== user.name;
  currentUser = { id: user.id, name: user.name, email: user.email };
  if (userChanged) {
    window.dispatchEvent(new Event("authChanged"));
  }
  return user;
};

const clearCachedUser = () => {
  const hadCachedUser = currentUser !== null;
  currentUser = null;
  if (hadCachedUser) {
    window.dispatchEvent(new Event("authChanged"));
  }
};

export const getDemoUser = () => currentUser;

export const getCurrentUser = async () => {
  try {
    const { user } = await apiRequest(`${AUTH_API}/me`);
    return cacheUser(user);
  } catch (error) {
    if (error.message === "You are not logged in.") {
      clearCachedUser();
      return null;
    }
    throw error;
  }
};

export const registerUser = async (account) => {
  const { user } = await apiRequest(`${AUTH_API}/signup`, {
    method: "POST",
    body: JSON.stringify(account),
  });
  return cacheUser(user);
};

export const loginUser = async (credentials) => {
  const { user } = await apiRequest(`${AUTH_API}/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  cacheUser(user);
  window.dispatchEvent(new Event("loginSuccessful"));
  return user;
};

export const endDemoSession = async () => {
  try {
    await apiRequest(`${AUTH_API}/logout`, { method: "POST" });
  } finally {
    clearCachedUser();
  }
};
