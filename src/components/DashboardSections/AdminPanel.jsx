function AdminPanel() {
  const registrations = [
    {
      name: "Ankit Kumar",
      state: "Punjab",
      department: "GST Risk",
      date: "2026-06-01",
    },
    {
      name: "Rahul Sharma",
      state: "Haryana",
      department: "GST Intelligence",
      date: "2026-06-02",
    },
  ];

  const passwordRequests = [
    {
      officer: "Neha Verma",
      request: "Forgot Password",
      status: "Pending",
    },
    {
      officer: "Aman Singh",
      request: "Change Password",
      status: "Pending",
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "30px",
        }}
      >
        Admin Dashboard
      </h1>

      {/* KPI CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <Card
          title="Total Officers"
          value="482"
        />

        <Card
          title="New Users"
          value="31"
        />

        <Card
          title="Password Requests"
          value="9"
        />

        <Card
          title="Active Today"
          value="121"
        />
      </div>

      {/* REGISTRATIONS */}

      <TableContainer
        title="Recent Registrations"
      >
        <table style={tableStyle}>
          <thead>
            <tr style={headStyle}>
              <th>Name</th>
              <th>State</th>
              <th>Department</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {registrations.map(
              (user, index) => (
                <tr
                  key={index}
                  style={
                    rowStyle
                  }
                >
                  <td
                    style={
                      cellStyle
                    }
                  >
                    {user.name}
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {user.state}
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {
                      user.department
                    }
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {user.date}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* PASSWORD REQUESTS */}

      <TableContainer
        title="Password Requests"
      >
        <table style={tableStyle}>
          <thead>
            <tr style={headStyle}>
              <th>Officer</th>
              <th>Request</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {passwordRequests.map(
              (
                item,
                index
              ) => (
                <tr
                  key={index}
                  style={
                    rowStyle
                  }
                >
                  <td
                    style={
                      cellStyle
                    }
                  >
                    {
                      item.officer
                    }
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {
                      item.request
                    }
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    {
                      item.status
                    }
                  </td>

                  <td
                    style={
                      cellStyle
                    }
                  >
                    <button
                      style={
                        approveStyle
                      }
                    >
                      Process
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}

function Card({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#102A43",
        padding: "25px",
        borderRadius: "20px",
      }}
    >
      <p
        style={{
          color: "#B0BEC5",
          marginBottom: "10px",
        }}
      >
        {title}
      </p>

      <h1>{value}</h1>
    </div>
  );
}

function TableContainer({
  title,
  children,
}) {
  return (
    <div
      style={{
        background: "#102A43",
        padding: "30px",
        borderRadius: "20px",
        marginBottom: "30px",
      }}
    >
      <h2
        style={{
          marginBottom: "20px",
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}

const tableStyle = {
  width: "100%",
};

const headStyle = {
  textAlign: "left",
  color: "#B0BEC5",
};

const rowStyle = {
  background: "#163B5C",
};

const cellStyle = {
  padding: "18px",
};

const approveStyle = {
  background: "#00D4FF",
  border: "none",
  padding: "10px 16px",
  borderRadius: "10px",
  cursor: "pointer",
};

export default AdminPanel;