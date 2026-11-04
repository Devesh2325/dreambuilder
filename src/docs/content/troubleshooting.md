# Troubleshooting

Open your browser's console first. FlowPilot logs a message starting with `[FlowPilot]` when it can't load something.

## Nothing appears on my site

- **Is it published?** Drafts are never shown. Check for the **Live** label on the project.
- **Is the ID right?** The console warns when a project isn't published or the ID is wrong.
- **Have you already seen it?** The default frequency is once per visitor. Test in a private window, or call `FlowPilot.start()` to skip the rules.
- **Do the URL rules match?** Rules compare against the page path, such as `/dashboard`, without your domain.
- **Is there a delay?** Check the delay, scroll and exit-intent settings. If several are set, the first to happen wins. Exit intent only works with a mouse.
- **Does it apply to this device?** Check the device settings.
- **Is it blocked?** Ad blockers and Content Security Policies can stop the script. See [CSP setup](install).

## An inline experience is missing

Check that the `<div data-flowpilot="...">` is on the page when the script starts, with the right ID. If your framework adds it later, call `FlowPilot.start()` afterwards.

## A tour step appears in the center of the screen

Its target element wasn't found within about 2.5 seconds. Check the selector in the editor, or use **Pick on my site** to choose again. Avoid selectors based on generated class names, since they change between builds. A stable attribute such as `data-tour="reports"` is best, and the picker prefers those when they exist.

To hide a step when its target is missing, set **If the target is missing** to **Skip this step**.

## The picker doesn't react

The page you open must have the FlowPilot script installed, and it must be the same tab the editor opened. Some sites block being opened this way with their security settings. You can always type a selector by hand.

## My published site shows old content

Editing only changes the draft. Click **Publish changes** to update what visitors see.

## "That web address is already taken"

Addresses are shared by all FlowPilot users. Choose a different one.

## "Your plan's project limit has been reached"

Delete a project you no longer need, or contact us to change your plan.

## A save conflict appeared in the editor

Someone else, or you in another tab, saved the same page. Choose **Load their version** to discard your recent edits, or **Keep my version** to replace theirs.
