# Menus

A menu is a navigation bar you can place in any site.

## Install

Place it where the bar should appear, usually first in the `<body>`:

```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## Links

Enter one link per line, as `Label | link`:

```
Pricing | /pricing
Docs | https://docs.example.com
```

The bar wraps onto several lines on small screens. There's no collapsed mobile menu yet.
