# AI Development Context and Code Change Logging Policy

## PRIMARY RULE: Always Document Code Changes

Every time you modify the codebase, you MUST create a new documentation file inside @docs/changes/ directory that records:

1. What feature/change was made
2. What files were modified
3. The exact code added or changed
4. BEFORE and AFTER versions of modified code
5. A clear explanation of the code
6. Why the change was necessary

This applies to:

- Creating new files
- Editing existing files
- Adding functions
- Refactoring code
- Fixing bugs
- Adding dependencies
- Updating configurations

No codebase modification is allowed without creating a log file.

---

# Documentation File Rules

## File Location

All change logs must be saved inside:

docs/changes/

If the folder does not exist, create it.

---

## File Naming Format

Use:

YYYY-MM-DD-feature-name.md

Examples:

2026-04-26-login-feature.md  
2026-04-26-authentication-api.md  
2026-04-27-database-schema-update.md  
2026-04-27-bugfix-login-validation.md  

Use short, descriptive names.

---

# REQUIRED FILE STRUCTURE

Every change log MUST follow this structure exactly.

---

# Feature: <Feature Name>

Date: <YYYY-MM-DD>

---

## Summary

Describe in 2–4 sentences:

- What was implemented
- What functionality was added
- What problem was solved

---

## Files Modified

List all affected files.

Example:

- backend/routes/auth.py
- frontend/components/LoginForm.jsx
- backend/models/user.py

---

# Code Changes

## CASE 1 — New File Created

If a NEW file is created:

You MUST include the FULL file contents.

Example:

File Created:

frontend/components/LoginForm.jsx

```javascript
// function LoginForm() {
//   return <div>Login</div>;
// }

// export default LoginForm;

## At the end of every documentation, add a summarize feature commit message for git:

    git commit -m 'added docs/changes/2026-04-26-login-jwt-session.md'