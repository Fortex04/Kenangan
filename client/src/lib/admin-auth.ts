const ADMIN_KEY = "admin_authenticated";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(password: string): boolean {
  if (password === "admin123") {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_KEY);
}
