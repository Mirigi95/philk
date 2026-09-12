// AutoLogout.js
import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const useAutoLogout = (timeoutInMinutes = 15) => {
  const navigate = useNavigate();
  const location = useLocation();
  const TIMEOUT = timeoutInMinutes * 60 * 1000;

  const logout = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem("lastActivity"); // Clean up
    localStorage.setItem("logout-event", Date.now().toString());
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    // 1. Exit if on public pages
    const publicPages = ["/login", "/", "/onboard"];
    if (publicPages.includes(location.pathname)) return;

    let timer;

    const resetTimer = () => {
      localStorage.setItem("lastActivity", Date.now().toString()); // Record activity
      if (timer) clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT);
    };

    // 2. Check for "Dead" sessions when the window gains focus
    const checkSession = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (lastActivity && Date.now() - parseInt(lastActivity) > TIMEOUT) {
        logout();
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === "logout-event") logout();
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", checkSession); // Critical for background tabs

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", checkSession);
    };
  }, [logout, TIMEOUT, location.pathname]);
};

export default useAutoLogout;