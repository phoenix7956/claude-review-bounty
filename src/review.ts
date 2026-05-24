import { PRInfo } from "./github";

export interface ReviewOutput {
  summary: string;
  risks: string[];
  suggestions: string[];
  confidence: "Low" | "Medium" | "High";
  filesAnalyzed: number;
}

export function analyzePR(pr: PRInfo): ReviewOutput {
  // ── Risk patterns (25+, 5 categories) ────────────────────────────────────

  // 🔒 Security (10 patterns)
  const securityPatterns: [RegExp, string][] = [
    [/password\s*=\s*["'][^"']+["']/i, "⚠️ Security: Hardcoded password detected"],
    [/secret\s*=\s*["'][^"']+["']/i, "⚠️ Security: Hardcoded secret detected"],
    [/api[_-]?key\s*=\s*["'][^"']+["']/i, "⚠️ Security: Hardcoded API key detected"],
    [/token\s*=\s*["'][^"']{10,}["']/i, "⚠️ Security: Hardcoded auth token detected"],
    [/eval\s*\(/i, "⚠️ Security: eval() usage — dynamic code execution risk"],
    [/new Function\s*\(/i, "⚠️ Security: new Function() — dynamic code execution risk"],
    [/exec\s*\(/i, "⚠️ Security: exec() usage — command injection risk"],
    [/innerHTML\s*=/i, "⚠️ Security: innerHTML assignment — XSS risk"],
    [/localStorage\.setItem\s*\(\s*["']token["']/i, "⚠️ Security: Token stored in localStorage"],
    [/process\.env\.\w+\s*\?\?\s*["'][^"']+["']/i, "⚠️ Security: Env fallback to hardcoded value"],
  ];

  // 📐 Code Quality (8 patterns)
  const qualityPatterns: [RegExp, string][] = [
    [/TODO|FIXME|HACK|XXX/i, "📝 Code Quality: Unresolved code comment (TODO/FIXME/HACK)"],
    [/\bvar\s+\w+\s*=/i, "📝 Code Quality: Using 'var' instead of 'let'/'const'"],
    [/==\s*null|!=\s*null/i, "📝 Code Quality: Loose equality (use === instead)"],
    [/==\s*undefined|!=\s*undefined/i, "📝 Code Quality: Loose equality with undefined"],
    [/!is\s+\w+/i, "📝 Code Quality: Double negation (!is)"],
    [/\bdebugger\b/i, "📝 Code Quality: debugger statement left in code"],
    [/console\.(log|warn|error)\s*\(/i, "📝 Code Quality: console.log/warn/error in code"],
    [/\.then\(\s*\(\s*\)\s*=>/i, "📝 Code Quality: Missing .catch() on promise chain"],
  ];

  // ⚡ Performance (4 patterns)
  const perfPatterns: [RegExp, string][] = [
    [/for\s*\(\s*\w+\s+in\s+\w+\s*\)/i, "⚡ Performance: for...in loop (use Object.keys/values instead)"],
    [/\.forEach\s*\(/i, "⚡ Performance: forEach — consider for...of or .map()"],
    [/\.slice\(\s*0\s*\)/i, "⚡ Performance: unnecessary .slice(0) — use spread/rest instead"],
    [/new Date\s*\(\s*["']\d{4}-\d{2}-\d{2}/i, "⚡ Performance: Date constructor from string (use Date.parse)"],
  ];

  // 🐛 Potential Bugs (4 patterns)
  const bugPatterns: [RegExp, string][] = [
    [/if\s*\(\s*true\s*\)|if\s*\(\s*1\s*\)/i, "🐛 Bug: Always-true conditional"],
    [/catch\s*\(\s*\)\s*\{/i, "🐛 Bug: Empty catch block — errors silently swallowed"],
    [/&&\s*true|\|\|\s*false/i, "🐛 Bug: Redundant boolean operation"],
    [/\.env.*password|config.*password/i, "🐛 Bug: Password in config/env file"],
  ];

  // ✅ Test Detection (5 patterns)
  const testPatterns: [RegExp, string][] = [
    [/\bit\s*\(/i, "✅ Test: Jest/Mocha 'it()' test detected"],
    [/describe\s*\(/i, "✅ Test: Jest/Mocha 'describe()' block detected"],
    [/@pytest\.fixture/i, "✅ Test: pytest fixture detected"],
    [/def test_/i, "✅ Test: Python test function detected"],
    [/func Test\w+\(/i, "✅ Test: Go test function detected"],
  ];

  // Aggregate all patterns
  const allPatterns = [
    ...securityPatterns,
    ...qualityPatterns,
    ...perfPatterns,
    ...bugPatterns,
    ...testPatterns,
  ];

  const risks: string[] = [];
  for (const [pattern, message] of allPatterns) {
    if (pattern.test(pr.diff)) {
      risks.push(message);
    }
  }

  // Estimate complexity
  const totalChanges = pr.additions + pr.deletions;
  const complexity = totalChanges > 500 ? "large" : totalChanges > 100 ? "medium" : "small";

  // Confidence based on diff size
  let confidence: "Low" | "Medium" | "High" = "Medium";
  if (pr.diff.length < 2000) confidence = "High";
  else if (pr.diff.length > 50000) confidence = "Low";

  // Suggestions
  const suggestions: string[] = [];
  if (pr.body.length < 20) suggestions.push("PR description is very brief — add more context");
  if (pr.additions > 300) suggestions.push("Large PR — consider splitting into smaller changes");
  if (risks.some(r => r.includes("Security"))) suggestions.push("Security issues detected — review carefully before merging");
  if (!pr.diff.includes("test")) suggestions.push("No test changes detected — consider adding tests");
  if (pr.diff.includes("main") && !pr.diff.includes("master")) suggestions.push("Direct main branch modification — use feature branches");
  if (!risks.some(r => r.includes("Test:"))) suggestions.push("No test coverage detected — consider adding tests");
  if (suggestions.length === 0) suggestions.push("Code looks reasonable — standard review practices apply.");

  return {
    summary: `${pr.title} modifies ${pr.filesChanged.length} file(s) with ${pr.additions} additions and ${pr.deletions} deletions. This is a ${complexity} change.`,
    risks: risks.length > 0 ? risks : ["No obvious security risks detected in the diff."],
    suggestions,
    confidence,
    filesAnalyzed: pr.filesChanged.length,
  };
}

export function formatMarkdown(pr: PRInfo, review: ReviewOutput): string {
  return `## 📋 PR Review: ${pr.title}

### Summary
${review.summary}

### 🔍 Risks
${review.risks.map((r) => `- ${r}`).join("\n")}

### 💡 Suggestions
${review.suggestions.map((s) => `- ${s}`).join("\n")}

### ✅ Confidence Score: **${review.confidence}**

---
*Analyzed ${review.filesAnalyzed} file(s) | ${pr.additions} additions / ${pr.deletions} deletions*
*Review generated by claude-review CLI*`;
}
