import { readFileSync } from "node:fs";
import process from "node:process";
import { parse } from "yaml";

const ALERT_VALIDATION_TARGETS = [
  {
    file: "infrastructure/monitoring/alerts/chat-files.rules.yml",
    requiredAlerts: [
      "ChatFilesHigh5xxRate",
      "ChatFilesP95LatencyHigh",
      "ChatFilesTrafficDrop",
      "ChatFilesDbP95LatencyHigh",
      "FilesUploadBacklogHigh",
      "ChatSocketConnectionsDrop"
    ]
  },
  {
    file: "infrastructure/monitoring/alerts/phase7-services.rules.yml",
    requiredAlerts: [
      "Phase7High5xxRate",
      "AnalyticsIngestFailureRateHigh",
      "AnalyticsIngestLagHigh",
      "NotificationRetryBacklogHigh",
      "NotificationInvalidCallbacksHigh",
      "PublicApiAuthFailuresHigh"
    ]
  }
];
const requiredLabels = ["severity", "team", "service_group"];
const requiredAnnotations = ["summary", "description", "runbook"];

function fail(message) {
  console.error(`Alert rules validation failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function validateAlertTarget(target) {
  let parsed;
  try {
    const raw = readFileSync(target.file, "utf8");
    parsed = parse(raw);
  } catch (error) {
    fail(`could not read/parse ${target.file}: ${String(error)}`);
  }

  assert(typeof parsed === "object" && parsed !== null, "rules file must be a YAML object");
  assert(Array.isArray(parsed.groups) && parsed.groups.length > 0, "`groups` must be a non-empty list");

  const firstGroup = parsed.groups[0];
  assert(typeof firstGroup.name === "string" && firstGroup.name.length > 0, "group `name` is required");
  assert(Array.isArray(firstGroup.rules) && firstGroup.rules.length > 0, "group `rules` must be non-empty");

  const alertsByName = new Map();
  for (const rule of firstGroup.rules) {
    assert(typeof rule.alert === "string" && rule.alert.length > 0, "each rule must define `alert`");
    assert(typeof rule.expr === "string" && rule.expr.trim().length > 0, `rule ${rule.alert} must define a non-empty expr`);
    assert(typeof rule.for === "string" && rule.for.trim().length > 0, `rule ${rule.alert} must define a non-empty for`);
    assert(typeof rule.labels === "object" && rule.labels !== null, `rule ${rule.alert} must define labels`);
    assert(typeof rule.annotations === "object" && rule.annotations !== null, `rule ${rule.alert} must define annotations`);

    for (const labelKey of requiredLabels) {
      assert(typeof rule.labels[labelKey] === "string" && rule.labels[labelKey].length > 0, `rule ${rule.alert} missing label ${labelKey}`);
    }

    for (const annotationKey of requiredAnnotations) {
      assert(
        typeof rule.annotations[annotationKey] === "string" && rule.annotations[annotationKey].length > 0,
        `rule ${rule.alert} missing annotation ${annotationKey}`
      );
    }

    alertsByName.set(rule.alert, true);
  }

  for (const alertName of target.requiredAlerts) {
    assert(alertsByName.has(alertName), `missing required alert: ${alertName}`);
  }

  console.log(`Alert rules validation passed: ${target.file}`);
}

function main() {
  for (const target of ALERT_VALIDATION_TARGETS) {
    validateAlertTarget(target);
  }
}

main();
