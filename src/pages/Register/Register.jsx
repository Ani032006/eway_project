import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#004848",
      }}
    >
      <div
        style={{
          width: "450px",
          background: "#005F5F",
          padding: "40px",
          borderRadius: "20px",
          color: "white",
        }}
      >
        <h2
          style={{
            color: "white",
            marginBottom: "30px",
            fontSize: "32px",
          }}
        >
          Officer Registration
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <input
            placeholder="Full Name"
            style={inputStyle}
          />

          <input
            placeholder="Email"
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            style={inputStyle}
          />

          <input
            placeholder="State / Jurisdiction"
            style={inputStyle}
          />

          <button style={buttonStyle}>
            Register
          </button>

          <p
            style={{
              color: "#E0E0E0",
            }}
          >
            Already have an account?{" "}
            <span
              onClick={() =>
                navigate("/login")
              }
              style={{
                color: "#FFFFCC",
                cursor: "pointer",
              }}
            >
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  padding: "18px",
  borderRadius: "12px",
  color: "#000",
  fontSize: "16px",
};

const buttonStyle = {
  background: "#FFFFCC",
  color: "#000",
  border: "none",
  padding: "18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
};

export default Register;
