import { useEffect, useState } from "react";
import "./App.css";
import { Home } from "./views/Home/Home";
import { Login } from "./views/Login/Login";

function App() {
  const [route, setRoute] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || "#/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "#/login") {
    return <Login />;
  }

  return (
    <Home />
  );
}

export default App;
