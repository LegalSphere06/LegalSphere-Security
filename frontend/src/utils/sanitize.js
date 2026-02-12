/**
 * Sanitize user input by stripping HTML tags and trimming whitespace.
 * Use this on all user-entered text BEFORE sending to the API.
 *
 * @param {string} input - Raw user input string
 * @returns {string} Sanitized string with HTML tags removed
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  // Remove all HTML tags - using bounded quantifier to prevent ReDoS
  // Limits tag content to 1000 chars to prevent catastrophic backtracking
  const stripped = input.replaceAll(/<[^>]{0,1000}>/g, "");
  // Remove potentially dangerous characters/patterns
  const cleaned = stripped
    .replaceAll(/javascript:/gi, "")
    .replaceAll(/on\w+\s*=/gi, "")
    .replaceAll(/data:/gi, "")
    .replaceAll(/vbscript:/gi, "");
  return cleaned.trim();
};

/**
 * Escape HTML special characters for safe embedding in HTML strings.
 * Use this when dynamically building HTML strings (e.g., ArcGIS popup templates).
 *
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== "string") return String(str ?? "");
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return str.replaceAll(/[&<>"'/]/g, (char) => escapeMap[char]);
};

/**
 * Recursively sanitize all string values in an object.
 * Use this to sanitize entire API response payloads.
 *
 * @param {*} obj - Object, array, or primitive to sanitize
 * @returns {*} Deep-sanitized copy
 */
export const sanitizeObject = (obj) => {
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === "object") {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
};

/**
 * Validate and sanitize a URL to prevent javascript: and data: protocol attacks.
 * Use this before rendering user-provided or API-returned URLs in href/src attributes.
 *
 * @param {string} url - URL to validate
 * @returns {string} Safe URL or empty string if malicious
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return "";
  }
  return trimmed;
};
