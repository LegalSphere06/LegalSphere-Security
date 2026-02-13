import validator from "validator";

/**
 * Validates password strength.
 * Requirements:
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 number
 *   - At least 1 special character (!@#$%^&* etc.)
 *
 * @param {string} password
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required" };
  }

  const isStrong = validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });

  if (!isStrong) {
    return {
      isValid: false,
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    };
  }

  return { isValid: true, message: "Password is valid" };
};
