# WC Primitives - AI Instructions

## Overview

This is a web components library designed for fullstack developers (Laravel, Rails, etc.) who want to use accessible UI components as HTML tags without writing JavaScript.

## Architecture

### Components

Each component uses Shadow DOM with named slots for content projection:

- **wc-button** - Accessible button with keyboard support
- **wc-dialog** - Modal dialog with backdrop
- **wc-tabs** - Tab navigation  
- **wc-accordion** - Collapsible sections
- **wc-select** - Advanced select with search, multiple selection, remote loading, and create option

### Slot Pattern

Components use `slot` attributes to project content:

```html
<wc-dialog>
  <button slot="trigger">Open</button>
  <div slot="content">Dialog content</div>
</wc-dialog>

<wc-tabs value="tab1">
  <div slot="tabs">
    <button data-value="tab1">Tab 1</button>
  </div>
  <div slot="panels" data-value="tab1">Panel 1</div>
</wc-tabs>

<wc-accordion>
  <wc-accordion-item open>
    <button slot="trigger">Title</button>
    <div slot="content">Content</div>
  </wc-accordion-item>
</wc-accordion>
```

### Select Component

The select component supports multiple features:

```html
<!-- Basic select -->
<wc-select name="color" placeholder="Choose a color" clearable>
  <wc-option value="red">Red</wc-option>
  <wc-option value="blue">Blue</wc-option>
</wc-select>

<!-- Searchable select -->
<wc-select name="country" searchable clearable>
  <wc-option value="us">United States</wc-option>
  <wc-option value="uk">United Kingdom</wc-option>
</wc-select>

<!-- Multiple selection with tags -->
<wc-select name="tags" multiple searchable clearable>
  <wc-option value="js">JavaScript</wc-option>
  <wc-option value="py">Python</wc-option>
</wc-select>

<!-- Create new options on the fly -->
<wc-select name="tags" multiple searchable create clearable>
  <wc-option value="bug">Bug</wc-option>
</wc-select>

<!-- Remote loading from URL -->
<wc-select 
  name="user"
  url="/api/users"
  search-param="q"
  value-field="id"
  label-field="name"
  min-chars="2"
  searchable
  clearable
></wc-select>
```

**Select Attributes:**
- `name` - Form field name
- `value` - Selected value(s), comma-separated for multiple
- `placeholder` - Placeholder text
- `disabled` - Disable the select
- `multiple` - Allow multiple selections
- `searchable` - Enable search/filtering
- `clearable` - Show clear button on hover
- `create` - Allow creating new options by typing
- `url` - Remote URL for loading options
- `search-param` - Query parameter name (default: "q")
- `value-field` - JSON field for option value (default: "value")
- `label-field` - JSON field for option label (default: "label")
- `min-chars` - Minimum characters before remote search (default: 1)

**Select Events:**
- `change` - Fired when selection changes
- `create` - Fired when new option is created (detail: { value, label })

**Select Methods:**
- `clear()` - Clear all selections
- `focus()` - Focus the input
- `blur()` - Blur and close dropdown
- `setOptions(options)` - Programmatically set options
- `addOption(option)` - Add a single option

### FOUC Prevention

CSS must include these rules to hide slotted content before components are defined:

```css
wc-dialog:not(:defined) [slot="content"],
wc-tabs:not(:defined) [slot="panels"],
wc-accordion-item:not(:defined) [slot="content"] {
  display: none !important;
}
```

### State Attributes

Components use `data-state` attribute for styling:
- Dialog: `open` | `closed`
- Tabs: `active` | `inactive`
- Accordion: `open` | `closed`
- Select: `open` attribute when dropdown is visible

### File Structure

```
src/
  index.js          # Entry point, exports registerAll()
  components/
    button.js       # Base button, extended by triggers
    dialog.js       # WcDialog, WcDialogTrigger, WcDialogClose
    tabs.js         # WcTabs
    accordion.js    # WcAccordion, WcAccordionItem, WcAccordionTrigger
    select.js       # WcSelect, WcOption
  utils/
    id.js           # ensureId() for generating unique IDs
    focus.js        # Focus management utilities
```

### Key Patterns

1. Shadow DOM encapsulates component styles
2. Named slots project user content
3. `part` attribute exposes elements for external styling
4. ARIA attributes are set automatically
5. Keyboard navigation follows WAI-ARIA patterns

### Adding New Components

1. Create class extending HTMLElement
2. Attach Shadow DOM in constructor
3. Define slots for user content
4. Add ARIA attributes in connectedCallback
5. Export define function
6. Add FOUC prevention CSS if needed
