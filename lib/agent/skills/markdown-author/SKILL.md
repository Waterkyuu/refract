---
name: markdown-author
description: This skill should be used when creating analysis reports, notes, documentation, or any content that benefits from rich Markdown formatting and creative visual presentation.
---


# Markdown Author Skill

This skill provides advanced and creative Markdown generation rules for producing visually rich, well-structured documents.


## Rule
1. Unless requested by the user, adding any emojis is strictly prohibited.

---

## Figure

### Side-by-Side Image Comparison
Place two images horizontally for comparison.

```html
<div style="display: flex; gap: 10px; justify-content: center;">
  <img src="image1.jpg" alt="Description 1" style="width: calc(50% - 5px); border-radius: 8px;">
  <img src="image2.jpg" alt="Description 2" style="width: calc(50% - 5px); border-radius: 8px;">
</div>
```

### Captioned Image
A centered image with a caption underneath.

```html
<div style="text-align: center;">
  <img src="diagram.png" alt="System Architecture" style="max-width: 80%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  <p style="font-size: 0.9em; color: #666; margin-top: 8px;"><em>Figure 1: System Architecture Overview</em></p>
</div>
```

---

## Underline

### Basic Underline
Always include `text-underline-offset: 3px;` for readability.

```html
<span style="text-decoration: underline; text-underline-offset: 3px;">Basic Underline</span>
```

### Colored Underline
```html
<span style="text-decoration: underline; text-decoration-color: red; text-underline-offset: 3px;">Red Underline</span>
<span style="text-decoration: underline; text-decoration-color: #2563eb; text-underline-offset: 3px;">Blue Underline</span>
```

---

## Wavy Lines

### Basic Wavy Underline
```html
<span style="text-decoration: wavy underline;">Wavy Underline</span>
```

### Custom Wavy Lines
```html
<span style="text-decoration: wavy underline red; text-underline-offset: 2px;">Red Wavy Line</span>
<span style="text-decoration: underline wavy #ff6b6b; text-underline-offset: 3px; text-decoration-thickness: 2px;">Pink Bold Wavy Line</span>
```

---

## Callout

```markdown
> [!NOTE]
> This is a standard informational note.

> [!TIP]
> This is a helpful tip or suggestion.

> [!IMPORTANT]
> This is an important piece of information.

> [!WARNING]
> This is a warning about potential issues.

> [!CAUTION]
> This is a caution about critical risks.
```

---

## Highlighted Text

### Background Highlight
```html
<span style="background-color: #fef08a; padding: 2px 6px; border-radius: 3px;">Yellow Highlight</span>
<span style="background-color: #bbf7d0; padding: 2px 6px; border-radius: 3px;">Green Highlight</span>
<span style="background-color: #bfdbfe; padding: 2px 6px; border-radius: 3px;">Blue Highlight</span>
<span style="background-color: #fecaca; padding: 2px 6px; border-radius: 3px;">Red Highlight</span>
```

---

## Badge / Tag

Inline colored labels for status, categories, or version indicators.

```html
<span style="display: inline-block; background-color: #22c55e; color: white; font-size: 0.75em; font-weight: 600; padding: 2px 8px; border-radius: 9999px; vertical-align: middle;">Active</span>
<span style="display: inline-block; background-color: #ef4444; color: white; font-size: 0.75em; font-weight: 600; padding: 2px 8px; border-radius: 9999px; vertical-align: middle;">Deprecated</span>
<span style="display: inline-block; background-color: #f59e0b; color: white; font-size: 0.75em; font-weight: 600; padding: 2px 8px; border-radius: 9999px; vertical-align: middle;">Beta</span>
<span style="display: inline-block; background-color: #6b7280; color: white; font-size: 0.75em; font-weight: 600; padding: 2px 8px; border-radius: 9999px; vertical-align: middle;">Draft</span>
```

### Outlined Badge
```html
<span style="display: inline-block; border: 1.5px solid #2563eb; color: #2563eb; font-size: 0.75em; font-weight: 600; padding: 1px 8px; border-radius: 9999px; vertical-align: middle;">v2.0</span>
```

---

## Card

Bordered, shadowed card containers for grouping related content.

```html
<div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
  <h4 style="margin: 0 0 8px 0;">Card Title</h4>
  <p style="margin: 0; color: #4b5563;">Card body content goes here. Use cards to group related information visually.</p>
</div>
```

### Colored Left Border Card (Accent Card)
```html
<div style="border-left: 4px solid #2563eb; padding: 12px 20px; margin: 16px 0; background-color: #eff6ff; border-radius: 0 8px 8px 0;">
  <strong>Key Insight:</strong> Use accent cards to draw attention to important takeaways.
</div>
```

---

## Two-Column Layout

Split content into side-by-side columns.

```html
<div style="display: flex; gap: 16px; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 250px;">
    <h4>Column 1</h4>
    <p>Left column content.</p>
  </div>
  <div style="flex: 1; min-width: 250px;">
    <h4>Column 2</h4>
    <p>Right column content.</p>
  </div>
</div>
```

---

## Divider with Label

A horizontal rule with centered text label for section separation.

```html
<div style="display: flex; align-items: center; gap: 12px; margin: 24px 0;">
  <div style="flex: 1; height: 1px; background-color: #d1d5db;"></div>
  <span style="color: #6b7280; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px;">Section Label</span>
  <div style="flex: 1; height: 1px; background-color: #d1d5db;"></div>
</div>
```

---

## Timeline

A vertical timeline for events, changelogs, or step-by-step processes.

```html
<div style="border-left: 3px solid #2563eb; margin-left: 8px; padding-left: 20px;">
  <div style="margin-bottom: 20px; position: relative;">
    <div style="position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; background-color: #2563eb; border-radius: 50%;"></div>
    <strong>Step 1 — Init</strong>
    <p style="margin: 4px 0 0; color: #4b5563;">Description of the first milestone.</p>
  </div>
  <div style="margin-bottom: 20px; position: relative;">
    <div style="position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; background-color: #2563eb; border-radius: 50%;"></div>
    <strong>Step 2 — Build</strong>
    <p style="margin: 4px 0 0; color: #4b5563;">Description of the second milestone.</p>
  </div>
  <div style="position: relative;">
    <div style="position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; background-color: #22c55e; border-radius: 50%;"></div>
    <strong style="color: #22c55e;">Step 3 — Complete</strong>
    <p style="margin: 4px 0 0; color: #4b5563;">Description of the final milestone.</p>
  </div>
</div>
```

---

## Definition List

Key-value pairs rendered as a styled definition block.

```html
<div style="margin: 16px 0;">
  <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
    <span style="font-weight: 600; min-width: 140px; color: #374151;">Name</span>
    <span style="color: #6b7280;">Markdown Author Skill</span>
  </div>
  <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
    <span style="font-weight: 600; min-width: 140px; color: #374151;">Version</span>
    <span style="color: #6b7280;">2.0.0</span>
  </div>
  <div style="display: flex; padding: 8px 0;">
    <span style="font-weight: 600; min-width: 140px; color: #374151;">Author</span>
    <span style="color: #6b7280;">Refract Team</span>
  </div>
</div>
```
