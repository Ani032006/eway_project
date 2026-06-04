const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== "string") return "Email is required";
  if (!EMAIL_REGEX.test(email.trim())) return "Invalid email format";
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

function validateRegisterBody(body) {
  const { name, email, password, state, department } = body;
  if (!name || !String(name).trim()) return "Name is required";
  const emailErr = validateEmail(email);
  if (emailErr) return emailErr;
  const passErr = validatePassword(password);
  if (passErr) return passErr;
  if (!state || !String(state).trim()) return "Jurisdiction state is required";
  if (!department || !String(department).trim()) return "Department is required";
  return null;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRegisterBody,
};
