# Form data and webhooks

Every form response is saved with its project. Open the project to read responses, delete them, or export them as CSV. CSV cells are protected against spreadsheet formula injection.

## Sending responses to your own system

In the editor, click an empty area of the canvas, then enter an address under **Form responses**. Each response is sent there as a `POST` request with a JSON body:

```json
{
  "event": "form.submitted",
  "projectId": "{{PROJECT_ID}}",
  "submissionId": "f7a1c2d4-0000-4000-8000-000000000000",
  "createdAt": "2026-11-04T12:00:00+00:00",
  "data": {
    "name": "Sam",
    "email": "sam@example.com"
  }
}
```

Keys in `data` are each field's **Field name**, which you can set in the editor.

Things to know:

- The address must start with `https://`.
- Webhooks use the `pg_net` extension, which must be turned on under **Database > Extensions** in Supabase. Without it, responses are still saved but not sent.
- A delivery is attempted once. If your server is down, the response is still saved in FlowPilot, so export it from there.
- Requests aren't signed. Use a long, hard-to-guess address, and treat the contents as untrusted input.
- Webhook addresses are never shown to visitors.

## Spam protection

Forms include a hidden field that real people don't fill in, and responses that fill it are discarded. Each source can send up to 10 responses per minute to a project.

## Limits

A single response can be up to 64 KB.
