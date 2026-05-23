---
name: markdown-report
description: Use markdown-report when you need to create professional analysis reports with rich formatting including tables, charts, flowcharts, and structured sections.
---


# Markdown Report Skill

This skill provides a professional analysis report template with rich Markdown formatting.

## Rule
1. Unless requested by the user, adding any emojis is strictly prohibited.
2. All chart image references MUST use the workspace download URL format: `![Chart Description](/api/file/{fileId}/download)`.
3. Use the `markdown-author` skill patterns for advanced visual elements (badges, cards, timelines, callouts, etc.).

---

## Report Template

```md
# {Report Title}

---

## Executive Summary

{2-3 sentence overview of the key findings and recommendations.}

---

## 1. Data Overview

### 1.1 Data Source

| Item | Detail |
|------|--------|
| Source | {file name or description} |
| Records | {rowCount} rows |
| Columns | {columnCount} columns |
| Time Range | {start} - {end} |
| Data Quality | {percentage}% complete |

### 1.2 Data Cleaning Summary

{Brief description of cleaning steps performed.}

| Step | Action | Records Affected |
|------|--------|-----------------|
| 1 | Removed duplicates | {n} |
| 2 | Filled missing values | {n} |
| 3 | Type corrections | {n} |
| 4 | Outlier treatment | {n} |

---

## 2. Key Findings

### 2.1 {Finding Category 1}

{Description with specific numbers.}

| Metric | Value | Change |
|--------|-------|--------|
| {metric 1} | {value} | {+/-%} |
| {metric 2} | {value} | {+/-%} |
| {metric 3} | {value} | {+/-%} |

### 2.2 {Finding Category 2}

{Description with specific numbers.}

---

## 3. Data Visualizations

### 3.1 {Chart 1 Title}

![{Chart 1 Description}](/api/file/{fileId}/download)

*Figure 1: {Chart 1 caption explaining what the chart shows and the key insight.}*

### 3.2 {Chart 2 Title}

![{Chart 2 Description}](/api/file/{fileId}/download)

*Figure 2: {Chart 2 caption explaining what the chart shows and the key insight.}*

### 3.3 Analysis Flowchart

When the analysis involves a decision process, use a Mermaid flowchart:

```mermaid
graph LR
    A[Raw Data] --> B[Cleaning]
    B --> C[Statistical Analysis]
    C --> D{Key Threshold?}
    D -->|Yes| E[Significant Finding]
    D -->|No| F[Normal Range]
    E --> G[Recommendation]
    F --> G
```

---

## 4. Statistical Summary

| Statistic | {Column 1} | {Column 2} | {Column 3} |
|-----------|-----------|-----------|-----------|
| Mean | {val} | {val} | {val} |
| Median | {val} | {val} | {val} |
| Std Dev | {val} | {val} | {val} |
| Min | {val} | {val} | {val} |
| Max | {val} | {val} | {val} |

---

## 5. Conclusions

> [!IMPORTANT]
> {Most critical finding that the reader must not miss.}

1. **{Conclusion 1}:** {Evidence-based statement with specific numbers.}
2. **{Conclusion 2}:** {Evidence-based statement with specific numbers.}
3. **{Conclusion 3}:** {Evidence-based statement with specific numbers.}

---

## 6. Recommendations

| Priority | Recommendation | Expected Impact | Effort |
|----------|---------------|----------------|--------|
| High | {action 1} | {impact} | {effort} |
| Medium | {action 2} | {impact} | {effort} |
| Low | {action 3} | {impact} | {effort} |

---

## Appendix

### Methodology

{Brief description of analytical methods used.}

### Limitations

- {Limitation 1}
- {Limitation 2}
```

---

## Image URL Rules

When referencing chart images in the report:

1. The pipeline prompt provides chart image URLs in the format:
   ```
   ### Chart N
   - Description: <chart description>
   - Image URL: ![<description>](<downloadUrl>)
   - fileId: <fileId>
   ```

2. You MUST use the exact Image URL provided in the prompt. Copy the full downloadUrl as-is into the report markdown:
   ```
   ![Chart Description](<downloadUrl>)
   ```

3. If the prompt provides downloadUrl values, use them directly (they are already full URLs).
   If only fileId is available, construct: `/api/file/{fileId}/download`

4. Always include a figure caption below the image using italics:
   ```
   *Figure N: Description of what the chart shows.*
   ```

5. Every chart provided in the prompt MUST appear in the report's Data Visualizations section. Do NOT skip any chart.

## Mermaid Diagram Rules

Use Mermaid diagrams when the report needs:

- Process flows: `graph TD` or `graph LR`
- Decision trees: `graph TD` with diamond `{} ` nodes
- Timelines: `graph LR` with sequential nodes
- Data pipelines: `graph LR` showing transformation steps

Keep diagrams simple. Maximum 10 nodes per diagram for readability.
```
