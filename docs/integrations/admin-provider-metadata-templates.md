# Integration Provider Metadata Templates (Admin Ops)

## Secret Policy (Production)

- Do not store plaintext tokens in connection metadata.
- Allowed secret patterns:
  - `apiTokenRef` / `accessTokenRef` pointing to an environment variable key.
  - `env:VAR_NAME` value format where `VAR_NAME` exists in runtime env.
- Disallowed:
  - direct values like `"apiToken": "abc123..."` or `"accessToken": "abc123..."`.

## Jira

Required metadata:

```json
{
  "baseUrl": "https://<tenant>.atlassian.net",
  "email": "ops@example.com",
  "projectKey": "PLAT",
  "apiTokenRef": "JIRA_API_TOKEN"
}
```

Optional metadata:

```json
{
  "issueTypeName": "Task"
}
```

## Asana

Required metadata:

```json
{
  "workspaceId": "1200000000000001",
  "projectId": "1200000000000002",
  "accessTokenRef": "ASANA_ACCESS_TOKEN"
}
```

## ClickUp

Required metadata:

```json
{
  "listId": "901234567",
  "apiTokenRef": "CLICKUP_API_TOKEN"
}
```

## Validation Checklist

1. Provider connection status is `CONNECTED`.
2. Required fields above are present and non-empty.
3. Secret uses ref/env indirection (no plaintext token).
4. Provider base identifiers resolve to valid workspace/project/list targets.
5. Test create-link operation succeeds once before enabling for production client workflows.
