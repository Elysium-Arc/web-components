# Bare Components

Zero-dependency, framework-agnostic web components for fullstack developers. Use accessible UI primitives as HTML tags — no JavaScript required.

Built for Laravel, Rails, Django, and any backend that renders HTML.

## Installation

```bash
npm install bare-components
```

Or use via CDN:

```html
<script type="module" src="https://unpkg.com/bare-components"></script>
```

## Quick Start

```html
<script type="module">
  import { registerAll } from 'bare-components';
  registerAll();
</script>

<wc-select name="color" placeholder="Pick a color" searchable clearable>
  <wc-option value="red">Red</wc-option>
  <wc-option value="blue">Blue</wc-option>
  <wc-option value="green">Green</wc-option>
</wc-select>
```

## Components

### Button

Accessible button with keyboard support.

```html
<wc-button>Click me</wc-button>
<wc-button disabled>Disabled</wc-button>
```

### Dialog

Modal dialog with backdrop and focus trapping.

```html
<wc-dialog>
  <button slot="trigger">Open Dialog</button>
  <div slot="content">
    <p>Dialog content here</p>
    <wc-dialog-close>Close</wc-dialog-close>
  </div>
</wc-dialog>
```

### Tabs

Accessible tab navigation with keyboard support.

```html
<wc-tabs value="tab1">
  <div slot="tabs">
    <button data-value="tab1">Tab 1</button>
    <button data-value="tab2">Tab 2</button>
  </div>
  <div slot="panels" data-value="tab1">Panel 1 content</div>
  <div slot="panels" data-value="tab2">Panel 2 content</div>
</wc-tabs>
```

### Accordion

Collapsible sections with single or multiple mode.

```html
<wc-accordion>
  <wc-accordion-item open>
    <button slot="trigger">Section 1</button>
    <div slot="content">Content 1</div>
  </wc-accordion-item>
  <wc-accordion-item>
    <button slot="trigger">Section 2</button>
    <div slot="content">Content 2</div>
  </wc-accordion-item>
</wc-accordion>
```

### Select

Advanced select with search, multiple selection, remote loading, and create option.

#### Basic

```html
<wc-select name="framework" placeholder="Choose..." clearable>
  <wc-option value="react">React</wc-option>
  <wc-option value="vue">Vue</wc-option>
  <wc-option value="svelte">Svelte</wc-option>
</wc-select>
```

#### Searchable

```html
<wc-select name="country" searchable clearable>
  <wc-option value="us">United States</wc-option>
  <wc-option value="uk">United Kingdom</wc-option>
</wc-select>
```

#### Multiple Selection

Includes "Select All / Deselect All" button and selection count.

```html
<wc-select name="skills" multiple searchable clearable>
  <wc-option value="js">JavaScript</wc-option>
  <wc-option value="py">Python</wc-option>
</wc-select>
```

#### Create New Options

```html
<wc-select name="tags" multiple searchable create clearable>
  <wc-option value="bug">Bug</wc-option>
  <wc-option value="feature">Feature</wc-option>
</wc-select>
```

#### Remote Loading

```html
<!-- With query parameter -->
<wc-select 
  name="user"
  url="https://api.github.com/search/users"
  search-param="q"
  value-field="login"
  label-field="login"
  min-chars="2"
  searchable
  clearable
></wc-select>

<!-- With URL template -->
<wc-select 
  name="country"
  url="https://restcountries.com/v3.1/name/{query}?fields=name,cca2"
  value-field="cca2"
  label-field="name.common"
  min-chars="2"
  searchable
  clearable
></wc-select>
```

#### Select Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Form field name |
| `value` | Selected value(s), comma-separated for multiple |
| `placeholder` | Placeholder text |
| `disabled` | Disable the select |
| `multiple` | Allow multiple selections |
| `searchable` | Enable search/filtering |
| `clearable` | Show clear button |
| `create` | Allow creating new options |
| `url` | Remote URL for loading options |
| `search-param` | Query parameter name (default: "q") |
| `value-field` | JSON field for option value (default: "value") |
| `label-field` | JSON field for option label, supports dot notation (default: "label") |
| `min-chars` | Minimum characters before search (default: 1) |

### Toast / Notifications

Stackable toast notifications with types, actions, and full customization.

#### Programmatic API

```javascript
import { WcToast } from 'bare-components';

// Simple toast
WcToast.show({
  type: 'success',
  title: 'Success!',
  message: 'Your changes have been saved.'
});

// Toast with actions
WcToast.show({
  type: 'warning',
  title: 'Confirm',
  message: 'Are you sure?',
  duration: 0, // Don't auto-dismiss
  actions: [
    { 
      label: 'Confirm', 
      class: 'bg-blue-500 text-white',
      onClick: () => console.log('Confirmed!')
    },
    { label: 'Cancel' }
  ]
});
```

#### Declarative HTML

```html
<!-- Container for positioning (max=5 limits visible toasts) -->
<wc-toast-container position="top-right" max="5"></wc-toast-container>

<!-- Individual toast -->
<wc-toast type="success" duration="5000">
  <span slot="title">File Uploaded</span>
  Your file has been uploaded successfully.
  <button slot="action" data-dismiss>View File</button>
</wc-toast>
```

#### Toast Options

| Option | Description |
|--------|-------------|
| `type` | `success`, `error`, `warning`, `info` |
| `title` | Toast title text |
| `message` | Toast message text |
| `duration` | Auto-dismiss time in ms (default: 5000, 0 = never) |
| `dismissible` | Show close button (default: true) |
| `actions` | Array of action buttons |
| `container` | Position: `top-right`, `top-left`, `top-center`, `bottom-right`, `bottom-left`, `bottom-center` |

#### Container Attributes

| Attribute | Description |
|-----------|-------------|
| `position` | Where toasts appear (default: `top-right`) |
| `max` | Maximum visible toasts (default: 5). Old toasts are dismissed when limit is exceeded. |

#### Styling Parts

```css
wc-toast::part(icon) { }
wc-toast::part(content) { }
wc-toast::part(title) { }
wc-toast::part(message) { }
wc-toast::part(actions) { }
wc-toast::part(close) { }
```

### Side Panel

A sliding drawer panel from either side of the screen.

```html
<!-- Trigger button -->
<button onclick="document.getElementById('my-panel').show()">Open Panel</button>

<!-- Side Panel -->
<wc-sidepanel id="my-panel" position="right" overlay>
  <span slot="title">Panel Title</span>
  
  <!-- Body content (default slot) -->
  <p>Panel content goes here...</p>
  
  <!-- Footer actions -->
  <div slot="footer">
    <button data-close>Cancel</button>
    <button>Save</button>
  </div>
</wc-sidepanel>
```

#### Attributes

| Attribute | Description |
|-----------|-------------|
| `open` | Panel is open |
| `position` | `left` or `right` (default: `right`) |
| `overlay` | Show backdrop overlay |

#### Methods

- `show()` - Open the panel
- `close()` - Close the panel  
- `toggle()` - Toggle open state

#### Events

- `open` - Fired when panel opens
- `close` - Fired when panel closes

#### Slots

- Default slot - Panel body content
- `title` - Panel title
- `footer` - Footer content (buttons, etc.)

#### Styling Parts

```css
wc-sidepanel::part(overlay) { }
wc-sidepanel::part(panel) { }
wc-sidepanel::part(header) { }
wc-sidepanel::part(title) { }
wc-sidepanel::part(close) { }
wc-sidepanel::part(body) { }
wc-sidepanel::part(footer) { }
```

#### Custom Width

```css
wc-sidepanel {
  --wc-sidepanel-width: 400px;
}
```

## Styling

Components use Shadow DOM but expose parts for styling:

```css
wc-select::part(control) {
  border-color: #3b82f6;
}

wc-select::part(dropdown) {
  max-height: 300px;
}
```

### FOUC Prevention

Add this CSS before your components to prevent flash of unstyled content:

```css
wc-dialog:not(:defined) [slot="content"],
wc-tabs:not(:defined) [slot="panels"],
wc-accordion-item:not(:defined) [slot="content"] {
  display: none !important;
}
```

## Events

| Component | Event | Description |
|-----------|-------|-------------|
| `wc-select` | `change` | Fired when selection changes |
| `wc-select` | `create` | Fired when new option is created |
| `wc-tabs` | `change` | Fired when tab changes |
| `wc-dialog` | `open` | Fired when dialog opens |
| `wc-dialog` | `close` | Fired when dialog closes |
| `wc-toast` | `dismiss` | Fired when toast is dismissed |

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
