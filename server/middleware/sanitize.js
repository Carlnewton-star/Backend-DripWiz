// Express 5 made req.query a getter-only property, which broke the two
// packages previously used here (express-mongo-sanitize, xss-clean) — both
// try to reassign req.query outright and throw
// "Cannot set property query of #<IncomingMessage> which has only a getter"
// on every single request. This replacement does the same two jobs
// (strip NoSQL operator injection, strip obvious script tags) by mutating
// the existing objects in place instead of replacing them, which works
// under both Express 4 and 5.

function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(stripDangerousKeys);
    return;
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
        continue;
      }
      stripDangerousKeys(value[key]);
    }
  }
}

function stripScriptTags(value, parent, key) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => stripScriptTags(item, value, i));
    return;
  }

  if (value && typeof value === "object") {
    for (const k of Object.keys(value)) {
      stripScriptTags(value[k], value, k);
    }
    return;
  }

  if (typeof value === "string" && parent) {
    parent[key] = value.replace(/<script[^>]*>.*?<\/script>/gi, "");
  }
}

module.exports = function sanitize(req, res, next) {
  for (const target of [req.body, req.params, req.query]) {
    stripDangerousKeys(target);
    stripScriptTags(target);
  }
  next();
};
