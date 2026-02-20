import { readFileSync } from "node:fs";
import process from "node:process";
import { parse } from "yaml";

const OPENAPI_VALIDATION_TARGETS = [
  {
    file: "docs/api/gateway-chat-files.openapi.yaml",
    requiredPathOperations: [
      ["/conversations", ["get", "post"]],
      ["/conversations/{conversationId}/messages", ["get"]],
      ["/messages", ["post"]],
      ["/files", ["get", "post"]]
    ],
    requiredSchemas: [
      "CreateConversationRequest",
      "CreateMessageRequest",
      "CreateFileRequest",
      "Conversation",
      "Message",
      "FileRecord"
    ]
  },
  {
    file: "docs/api/gateway-phase7.openapi.yaml",
    requiredPathOperations: [
      ["/ai/generate", ["post"]],
      ["/analytics/events", ["post"]],
      ["/notifications/jobs", ["get", "post"]],
      ["/public-api/projects", ["get", "post"]]
    ],
    requiredSchemas: [
      "AiGenerateRequest",
      "AnalyticsEventRequest",
      "NotificationJobRequest",
      "ProviderCallbackRequest",
      "PublicApiKeyIssueRequest",
      "PublicApiProjectCreateRequest"
    ]
  }
];

function fail(message) {
  console.error(`OpenAPI validation failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function validateOpenApiTarget(target) {
  let parsed;
  try {
    const raw = readFileSync(target.file, "utf8");
    parsed = parse(raw);
  } catch (error) {
    fail(`could not read/parse ${target.file}: ${String(error)}`);
  }

  assert(typeof parsed === "object" && parsed !== null, "spec must be a YAML object");
  assert(typeof parsed.openapi === "string", "`openapi` version is required");
  assert(parsed.openapi.startsWith("3."), "`openapi` must be a 3.x version");
  assert(typeof parsed.info?.title === "string", "`info.title` is required");
  assert(typeof parsed.info?.version === "string", "`info.version` is required");

  const paths = parsed.paths ?? {};
  for (const [pathKey, methods] of target.requiredPathOperations) {
    const operationSet = paths[pathKey];
    assert(operationSet, `missing path: ${pathKey}`);
    for (const method of methods) {
      const operation = operationSet[method];
      assert(operation, `missing operation: ${method.toUpperCase()} ${pathKey}`);
      assert(operation.responses && typeof operation.responses === "object", `missing responses for ${method.toUpperCase()} ${pathKey}`);
    }
  }

  const schemas = parsed.components?.schemas ?? {};
  for (const schemaName of target.requiredSchemas) {
    assert(schemas[schemaName], `missing schema: components.schemas.${schemaName}`);
  }

  console.log(`OpenAPI validation passed: ${target.file}`);
}

function main() {
  for (const target of OPENAPI_VALIDATION_TARGETS) {
    validateOpenApiTarget(target);
  }
}

main();
