# Show data from your API

A website or page can show a list that lives in your own system, such as products, blog posts, job openings or team members. It loads fresh each time someone visits, so you don't copy anything by hand.

## What you need

- An address that returns JSON, such as `https://api.yoursite.com/products`.
- It must be public. Each visitor's browser loads it directly, so never use an address that needs a secret key or password.
- It must allow other websites to read it. Developers call this CORS: the response needs an `Access-Control-Allow-Origin` header. If you're not sure, ask whoever built your API.

## Connect it

1. Open your website or page in the editor, then **Variables**.
2. Under **Data from your API**, click **Connect an API**.
3. Name it, such as Products, paste the address and click **Load it**. FlowPilot finds the lists in the response. If there's more than one, choose which.
4. Check what it found, then click **Save**.

## Show it on the page

The quickest way is **Show on the page** beside your list. It adds a section with one card per item, showing the item's picture, name, description and link where it can find them. Click a card to change its look, like any other block.

To use your own design instead, select any block, open **Behavior**, and choose your list under **Repeat for each item in**. That block then appears once per item. For text inside it, choose **+ Insert a variable**, and each field of your items is offered.

## Good to know

- Up to 200 items are shown.
- Nested values are flattened. For example, `price.amount` becomes the field `price_amount`.
- Values are always shown as plain text, pictures and links, never as code, so data can't change how your page works.
- In the editor, a list is loaded again at most once a minute. On your live site, each visit loads it.
- If your API can't be reached, the list just shows nothing, and the rest of the page works as usual.

Form answers go the other way, from your page to your system. See [Webhooks](webhooks).
