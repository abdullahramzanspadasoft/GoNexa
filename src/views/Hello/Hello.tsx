import { useEffect, useState } from "react";
import { authAPI, getToken, removeToken, type User } from "../../utils/api";

export function Hello() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      
      if (!token) {
        window.location.hash = "#/login";
        return;
      }

      try {
        const response = await authAPI.getCurrentUser(token);
        setUser(response.data);
      } catch (error) {
        removeToken();
        window.location.hash = "#/login";
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = () => {
    removeToken();
    window.location.hash = "#/login";
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "24px",
        color: "#fff",
        background: "url('/GoNexa.Header-image.jpg.jpeg') center/cover fixed no-repeat"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "url('/GoNexa.Header-image.jpg.jpeg') center/cover fixed no-repeat",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "#fff",
      padding: "40px 20px"
    }}>
      <div style={{
        background: "rgba(8, 8, 8, 0.75)",
        borderRadius: "20px",
        padding: "60px 40px",
        textAlign: "center",
        maxWidth: "600px",
        border: "1.5px solid rgba(99, 102, 241, 0.75)"
      }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: 700,
          marginBottom: "20px",
          background: "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Hello!
        </h1>
        
        <p style={{
          fontSize: "24px",
          marginBottom: "30px",
          color: "rgba(255, 255, 255, 0.9)"
        }}>
          Welcome, {user.firstName} {user.lastName}!
        </p>

        <div style={{
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.7)",
          marginBottom: "40px",
          textAlign: "left",
          background: "rgba(255, 255, 255, 0.05)",
          padding: "20px",
          borderRadius: "12px"
        }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>First Name:</strong> {user.firstName}</p>
          <p><strong>Last Name:</strong> {user.lastName}</p>
          {user.createdAt && (
            <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          )}
        </div>

        <button
          onClick={handleSignOut}
          style={{
            background: "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",
            color: "white",
            border: "none",
            padding: "14px 32px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
