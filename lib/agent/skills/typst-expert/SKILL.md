---
name: typst-expert
description: Use the typst-author skill to help users create professional and aesthetically pleasing typst documents. You should use this skill when users request the creation of papers, resumes, novels, short stories, or notes. Be sure to follow the principles and guidelines below when creating typst document.
---

# Typst-Author Skill

## When to Apply
Reference these guidelines when:
- The content that needs modification is in Typst format.
- Users need to create papers, resumes, or novels.
- Users insist on using the Typst format.

## Typst Syntax
Typst is a markup language. This means that you can use simple syntax to
accomplish common layout tasks. The lightweight markup syntax is complemented by
set and show rules, which let you style your document easily and automatically.
All this is backed by a tightly integrated scripting language with built-in and
user-defined functions.

### Modes
Typst has three syntactical modes: Markup, math, and code. Markup mode is the
default in a Typst document, math mode lets you write mathematical formulas, and
code mode lets you use Typst's scripting features.

You can switch to a specific mode at any point by referring to the following
table:

| New mode | Syntax                          | Example                         |
|----------|---------------------------------|---------------------------------|
| Code     | Prefix the code with `#`        | `[Number: #(1 + 2)]`            |
| Math     | Surround equation with `[$..$]` | `[$-x$ is the opposite of $x$]` |
| Markup   | Surround markup with `[[..]]`   | `{let name = [*Typst!*]}`       |

Once you have entered code mode with `#`, you don't need to use further hashes
unless you switched back to markup or math mode in between.

### Markup
Typst provides built-in markup for the most common document elements. Most of
the syntax elements are just shortcuts for a corresponding function. The table
below lists all markup that is available and links to the best place to learn
more about their syntax and usage.

| Name               | Example                      | See                      |
| ------------------ | ---------------------------- | ------------------------ |
| Paragraph break    | Blank line                   | [`parbreak`]             |
| Strong emphasis    | `[*strong*]`                 | [`strong`]               |
| Emphasis           | `[_emphasis_]`               | [`emph`]                 |
| Raw text           | ``[`print(1)`]``             | [`raw`]                  |
| Link               | `[https://typst.app/]`       | [`link`]                 |
| Label              | `[<intro>]`                  | [`label`]                |
| Reference          | `[@intro]`                   | [`ref`]                  |
| Heading            | `[= Heading]`                | [`heading`]              |
| Bullet list        | `[- item]`                   | [`list`]                 |
| Numbered list      | `[+ item]`                   | [`enum`]                 |
| Term list          | `[/ Term: description]`      | [`terms`]                |
| Math               | `[$x^2$]`                    | [Math]($category/math)   |
| Line break         | `[\]`                        | [`linebreak`]            |
| Smart quote        | `['single' or "double"]`     | [`smartquote`]           |
| Symbol shorthand   | `[~]`, `[---]`               | [Symbols]($category/symbols/sym) |
| Code expression    | `[#rect(width: 1cm)]`        | [Scripting]($scripting/#expressions) |
| Character escape   | `[Tweet at us \#ad]`         | [Below](#escapes)        |
| Comment            | `[/* block */]`, `[// line]` | [Below](#comments)       |

### Math mode { #math }
Math mode is a special markup mode that is used to typeset mathematical
formulas. It is entered by wrapping an equation in `[$]` characters. This works
both in markup and code. The equation will be typeset into its own block if it
starts and ends with at least one space (e.g. `[$ x^2 $]`). Inline math can be
produced by omitting the whitespace (e.g. `[$x^2$]`). An overview over the
syntax specific to math mode follows:

| Name                   | Example                  | See                      |
| ---------------------- | ------------------------ | ------------------------ |
| Inline math            | `[$x^2$]`                | [Math]($category/math)   |
| Block-level math       | `[$ x^2 $]`              | [Math]($category/math)   |
| Bottom attachment      | `[$x_1$]`                | [`attach`]($category/math/attach) |
| Top attachment         | `[$x^2$]`                | [`attach`]($category/math/attach) |
| Fraction               | `[$1 + (a+b)/5$]`        | [`frac`]($math.frac)     |
| Line break             | `[$x \ y$]`              | [`linebreak`]            |
| Alignment point        | `[$x &= 2 \ &= 3$]`      | [Math]($category/math)   |
| Variable access        | `[$#x$, $pi$]`           | [Math]($category/math)   |
| Field access           | `[$arrow.r.long$]`       | [Scripting]($scripting/#fields) |
| Implied multiplication | `[$x y$]`                | [Math]($category/math)   |
| Symbol shorthand       | `[$->$]`, `[$!=$]`       | [Symbols]($category/symbols/sym) |
| Text/string in math    | `[$a "is natural"$]`     | [Math]($category/math)   |
| Math function call     | `[$floor(x)$]`           | [Math]($category/math)   |
| Code expression        | `[$#rect(width: 1cm)$]`  | [Scripting]($scripting/#expressions) |
| Character escape       | `[$x\^2$]`               | [Below](#escapes)        |
| Comment                | `[$/* comment */$]`      | [Below](#comments)       |

### Code mode { #code }
Within code blocks and expressions, new expressions can start without a leading
`#` character. Many syntactic elements are specific to expressions. Below is
a table listing all syntax that is available in code mode:

| Name                     | Example                       | See                                |
| ------------------------ | ----------------------------- | ---------------------------------- |
| None                     | `{none}`                      | [`none`]                           |
| Auto                     | `{auto}`                      | [`auto`]                           |
| Boolean                  | `{false}`, `{true}`           | [`bool`]                           |
| Integer                  | `{10}`, `{0xff}`              | [`int`]                            |
| Floating-point number    | `{3.14}`, `{1e5}`             | [`float`]                          |
| Length                   | `{2pt}`, `{3mm}`, `{1em}`, .. | [`length`]                         |
| Angle                    | `{90deg}`, `{1rad}`           | [`angle`]                          |
| Fraction                 | `{2fr}`                       | [`fraction`]                       |
| Ratio                    | `{50%}`                       | [`ratio`]                          |
| String                   | `{"hello"}`                   | [`str`]                            |
| Label                    | `{<intro>}`                   | [`label`]                          |
| Math                     | `[$x^2$]`                     | [Math]($category/math)             |
| Raw text                 | ``[`print(1)`]``              | [`raw`]                            |
| Variable access          | `{x}`                         | [Scripting]($scripting/#blocks)    |
| Code block               | `{{ let x = 1; x + 2 }}`      | [Scripting]($scripting/#blocks)    |
| Content block            | `{[*Hello*]}`                 | [Scripting]($scripting/#blocks)    |
| Parenthesized expression | `{(1 + 2)}`                   | [Scripting]($scripting/#blocks)    |
| Array                    | `{(1, 2, 3)}`                 | [Array]($array)                    |
| Dictionary               | `{(a: "hi", b: 2)}`           | [Dictionary]($dictionary)          |
| Unary operator           | `{-x}`                        | [Scripting]($scripting/#operators) |
| Binary operator          | `{x + y}`                     | [Scripting]($scripting/#operators) |
| Assignment               | `{x = 1}`                     | [Scripting]($scripting/#operators) |
| Field access             | `{x.y}`                       | [Scripting]($scripting/#fields)    |
| Method call              | `{x.flatten()}`               | [Scripting]($scripting/#methods)   |
| Function call            | `{min(x, y)}`                 | [Function]($function)              |
| Argument spreading       | `{min(..nums)}`               | [Arguments]($arguments)            |
| Unnamed function         | `{(x, y) => x + y}`           | [Function]($function)              |
| Let binding              | `{let x = 1}`                 | [Scripting]($scripting/#bindings)  |
| Named function           | `{let f(x) = 2 * x}`          | [Function]($function)              |
| Set rule                 | `{set text(14pt)}`            | [Styling]($styling/#set-rules)     |
| Set-if rule              | `{set text(..) if .. }`       | [Styling]($styling/#set-rules)     |
| Show-set rule            | `{show heading: set block(..)}` | [Styling]($styling/#show-rules)  |
| Show rule with function  | `{show raw: it => {..}}`      | [Styling]($styling/#show-rules)    |
| Show-everything rule     | `{show: template}`            | [Styling]($styling/#show-rules)    |
| Context expression       | `{context text.lang}`         | [Context]($context)                |
| Conditional              | `{if x == 1 {..} else {..}}`  | [Scripting]($scripting/#conditionals) |
| For loop                 | `{for x in (1, 2, 3) {..}}`   | [Scripting]($scripting/#loops)     |
| While loop               | `{while x < 10 {..}}`         | [Scripting]($scripting/#loops)     |
| Loop control flow        | `{break, continue}`           | [Scripting]($scripting/#loops)     |
| Return from function     | `{return x}`                  | [Function]($function)              |
| Include module           | `{include "bar.typ"}`         | [Scripting]($scripting/#modules)   |
| Import module            | `{import "bar.typ"}`          | [Scripting]($scripting/#modules)   |
| Import items from module | `{import "bar.typ": a, b, c}` | [Scripting]($scripting/#modules)   |
| Comment                  | `{/* block */}`, `{// line}`  | [Below](#comments)                 |

### Argument Spreading and Loops

Argument spreading (`..`) can only spread arrays or argument lists. It cannot
spread content blocks produced by `for { ... }`. If you write `..for ... { ... }`
inside `grid()`, `stack()`, `table()`, or another function call, Typst reports
`cannot spread content`.

Wrong:

```typst
#grid(
  columns: 12,
  ..for i in range(12) {
    rect(width: 100%, height: 20pt)
  }
)
```

Correct:

```typst
#grid(
  columns: 12,
  ..range(12).map(i => rect(
    width: 100%,
    height: 20pt + i * 2pt,
  ))
)
```

When generating repeated children for a layout function, use
`..range(...).map(i => ...)` or prebuild an array, then spread that array. Never
use `..for ... { ... }` as a function argument.

### Comments
Comments are ignored by Typst and will not be included in the output. This is
useful to exclude old versions or to add annotations. To comment out a single
line, start it with `//`:

```example
// our data barely supports
// this claim

We show with $p < 0.05$
that the difference is
significant.
```

Comments can also be wrapped between `/*` and `*/`. In this case, the comment
can span over multiple lines:

```example
Our study design is as follows:
/* Somebody write this up:
   - 1000 participants.
   - 2x2 data design. */
```

### Escape sequences { #escapes }
Escape sequences are used to insert special characters that are hard to type or
otherwise have special meaning in Typst. To escape a character, precede it with
a backslash. To insert any Unicode codepoint, you can write a hexadecimal escape
sequence: `[\u{1f600}]`. The same kind of escape sequences also work in
[strings]($str).

```example
I got an ice cream for
\$1.50! \u{1f600}
```

### Identifiers
Names of variables, functions, and so on (_identifiers_) can contain letters,
numbers, hyphens (`-`), and underscores (`_`). They must start with a letter or
an underscore.

More specifically, the identifier syntax in Typst is based on the
[Unicode Standard Annex #31](https://www.unicode.org/reports/tr31/), with two
extensions: Allowing `_` as a starting character, and allowing both `_` and `-`
as continuing characters.

For multi-word identifiers, the recommended case convention is
[Kebab case](https://en.wikipedia.org/wiki/Letter_case#Kebab_case). In Kebab
case, words are written in lowercase and separated by hyphens (as in
`top-edge`). This is especially relevant when developing modules and packages
for others to use, as it keeps things predictable.

```example
#let kebab-case = [Using hyphen]
#let _schön = "😊"
#let 始料不及 = "😱"
#let π = calc.pi

#kebab-case
#if -π < 0 { _schön } else { 始料不及 }
// -π means -1 * π,
// so it's not a valid identifier
```

### Paths
Typst has various features that require a file path to reference external
resources such as images, Typst files, or data files. Paths are represented as
[strings]($str). There are two kinds of paths: Relative and absolute.

- A **relative path** searches from the location of the Typst file where the
  feature is invoked. It is the default:
  ```typ
  #image("images/logo.png")
  ```

- An **absolute path** searches from the _root_ of the project. It starts with a
  leading `/`:
  ```typ
  #image("/assets/logo.png")
  ```

## Mini Example

```typst
#set page(paper: "a4", margin: 2.2cm)
#set text(font: ("New Computer Modern", "SimSun", "PingFang SC"), lang: "en", size: 11pt, fallback: true)
#set par(justify: true)

= Title of Your Reinforcement Learning Paper

== Abstract
We propose *Your Algorithm*, a sample-efficient reinforcement-learning method that achieves state-of-the-art performance on the *X* benchmark. By leveraging *key idea*, our approach improves the mean return by *Y %* while reducing wall-clock time by *Z %*.

== 1 Introduction
Reinforcement learning (RL) aims to learn optimal policies $pi_*(a|s)$ that maximise the expected discounted return $E[ sum_(t=0)^infinity gamma^t r_t ]$. Despite recent successes, *problem statement* remains challenging. We address this gap by *contribution summary*.

== 2 Background
=== 2.1 Markov Decision Processes
An MDP is a tuple $M = ( cal(S), cal(A), P, R, gamma )$ with transition kernel $P(s'|s,a)$ and reward function $R(s,a)$. The state-value function satisfies the Bellman equation
$ V_pi(s) = E_(a~pi) [ R(s,a) + gamma E_(s'~P) V_pi(s') ] $.

=== 2.2 Off-Policy Evaluation
Off-policy estimators such as *Importance Sampling* re-weight returns from a behaviour policy $mu$ to evaluate a target policy $pi$.

== 3 Method
Our algorithm alternates between:
- *Phase 1* — learn latent representation $phi(s)$ via *objective*,
- *Phase 2* — optimise policy $pi_theta(a|phi(s))$ with clipped objective $J(theta) = E[ min( rho_t dot hat(A) , op("clip")(rho_t, 1-epsilon,1+epsilon) hat(A) ) ]$.

== 4 Experiments
We conduct experiments on *benchmark suite*. Results in Figure 1 show that our method achieves *higher sample efficiency* and *lower variance* than baseline algorithms.

== 5 Conclusion
We presented *Your Algorithm*, a principled approach that improves both learning speed and final performance. Future work includes extending the method to partially-observable settings.

== References
- Sutton, R. S. & Barto, A. G. *Reinforcement Learning: An Introduction*. MIT Press, 2018.
- Mnih, V. et al. Human-level control through deep reinforcement learning. *Nature* *518*, 529–533, 2015.
- Schulman, J. et al. Proximal policy optimization algorithms. arXiv:1707.06347, 2017.
```

## Key Principles
Please note: Typst is **not** LaTeX, nor is it **standard Markdown**. They are incompatible on key syntax terms. Please strictly adhere to the following rules to avoid confusion.

### Core Mindset

* **Abandon LaTeX Habits**: Do not use `\begin{}`, `\frac{}{}`, `\textbf{}`.
* **Abandon Markdown Habits**: Do not use `**bold**` (double asterisks).
* **Bracket Awareness**: Function calls always use parentheses `func()`, only content blocks use square brackets `[]`, and code blocks use curly braces `{}`.

### Critical Constraints
| Category | **Strictly Forbidden (LaTeX/MD)** | **Mandatory in Typst** | Reason / Explanation |
| :--- | :--- | :--- | :--- |
| **Bold** | `**text**` or `__text__` | `*text*` | Double asterisks are invalid in Typst; a **single asterisk** is used for bold. |
| **Italic** | `*text*` | `_text_` | The underscore is used for italics. |
| **Function Arguments** | `\sqrt{x}`, `\hat{x}`, `vec{x}` | `sqrt(x)`, `hat(x)`, `vec(x)` | **Always use parentheses** to wrap arguments. `{}` is only for code blocks. |
| **Fractions** | `\frac{a}{b}` | `(a)/(b)` | Use the division operator with parentheses if necessary. |
| **Greek Letters** | `\alpha`, `\beta` | `alpha`, `beta` | No backslash is needed. |
| **Subscript** | `x_{i}` | `x_i` | Although `x_{i}` is also valid in Typst, it is recommended to use `x_i` or `x_(i)`. |
| **Escaping** | `\#`, `\$` | `\#`, `\$` | To display `#` or `$` in text, they must be escaped. |
| **Spread Loops** | `..for i in range(12) { ... }` | `..range(12).map(i => ...)` | `..` can only spread arrays or argument lists, not content blocks. Otherwise Typst reports `cannot spread content`. |

### Math mode
Mathematical expressions are wrapped by `$`. Please strictly distinguish between **inline** and **block** formulas:

*   **Inline Formula**: Must be flush with content, **no spaces**.
    *   ❌ Wrong: `$ x^2 $` (This becomes block-level)
    *   ✅ Correct: `$x^2$` (Embedded within a text line)
*   **Block Formula**: **Must have spaces** on both ends.
    *   ✅ Correct: `$ x^2 + y^2 = 1 $`
*   **Operators and Text**:
    *   Standard functions (e.g., `sin`, `cos`, `max`, `log`) are written directly.
    *   **Custom text/variable names** (e.g., Loss, clip, attention): Must be enclosed in quotes or use the `op` function; otherwise, they will be parsed as variable multiplication.
    *   Example: `$L_(op("clip"))$` or `$text("Area") = x^2$`.
*   **Symbol Mapping**:
    *   Multiplication: `dot` (dot product $\cdot$), `times` (cross product $\times$)
    *   Sets: `in` ($\in$), `subset` ($\subset$)
    *   Arrows: `->` ($\rightarrow$), `=>` ($\Rightarrow$)
    *   Infinity: `infinity` ($\infty$)
    *   Integral: `integral` ($\int$)

## Font Safety Constraints

### 1. Mandatory System Default Fonts
When generating any Typst code containing non-ASCII characters (especially Chinese, Japanese, or Korean), **you are strictly forbidden** from using fonts that require manual installation (e.g., `"Noto Serif CJK SC"`, `"Source Han Serif SC"`, `"LXGW WenKai"`, or any custom downloaded font).
- You **must** use operating-system preinstalled default fonts only.
- You **must** provide at least three layers of fallback covering Windows, macOS, and Linux.
- You **must** explicitly set `fallback: true` in every `#set text(...)` rule that includes CJK content.

### 2. Allowed CJK Font Whitelist
CJK fonts **must** be chosen exclusively from the following system-default whitelist, arranged as a fallback chain:

```typst
#set text(
  font: (
    // Western font (optional but recommended)
    "New Computer Modern",
    // Chinese system font fallback chain
    "SimSun",              // Windows default Songti; highest coverage
    "Songti SC",           // macOS Songti
    "PingFang SC",         // macOS/iOS modern sans-serif
    "Microsoft YaHei",     // Windows default sans-serif
    "WenQuanYi Micro Hei", // Common Linux font
  ),
  lang: "zh",
  fallback: true,  // MUST be explicitly enabled; never omit
)
```

### 3. Single-Platform Shortcuts
If the target system is explicitly known, you may shorten the chain, but you **must** retain at least two fallback layers:

**Windows**:
```typst
#set text(font: ("New Computer Modern", "SimSun", "Microsoft YaHei"), lang: "zh", fallback: true)
```

**macOS**:
```typst
#set text(font: ("New Computer Modern", "Songti SC", "PingFang SC"), lang: "zh", fallback: true)
```

**Linux / Docker / WASM**:
```typst
#set text(font: ("New Computer Modern", "WenQuanYi Micro Hei", "Noto Sans CJK SC"), lang: "zh", fallback: true)
```
> **Note**: On Linux containers where even WenQuanYi may be absent, you **must** embed font files via the compiler API, or downgrade to pure-English output. Never assume system fonts exist in sandboxed environments.

### 4. Strictly Forbidden
- ❌ **Never** use `"Noto Serif CJK SC"` as a CJK font.
- ❌ **Never** use `"Source Han Serif SC"` as a CJK font.
- ❌ **Never** use any font requiring `apt install`, `apk add`, manual download, or package-manager installation.
- ❌ **Never** omit `fallback: true` when CJK text is present.
- ❌ **Never** specify only a single CJK font layer.
- ❌ **Never** output CJK text without a verified fallback chain.

### 5. Default Safe Template
If the target environment cannot be determined, you **must** use the following maximum-compatibility configuration:

```typst
#set text(
  font: ("New Computer Modern", "SimSun", "PingFang SC", "Microsoft YaHei"),
  lang: "zh",
  fallback: true,
)
```
> `SimSun` is present on virtually all Windows systems; `PingFang SC` is present on all macOS/iOS systems; `Microsoft YaHei` provides a sans-serif fallback. This combination prevents tofu (`[]`) when the preferred font is missing.

## How to Use This Skill

### Step 1. Check if the context provides a template
Check if the context provides a template. If so, strictly follow the template in your output. You can create other content with a more professional and aesthetically pleasing approach without violating the template, but the overall content must strictly adhere to the template.

### Step 2. Fully consider the needs of users
Before you start outputting the typst content, consider what the user's requirements are.

#### For Academic Papers / Articles
- **Setup**: `#set page(paper: "a4", margin: (x: 2cm, y: 2.5cm))`
- **Fonts**: Use professional serif fonts (e.g., `"Libertinus Serif"`, `"New Computer Modern"`) for Latin text. For CJK text, **strictly follow the Font Safety Constraints above**.
- **Columns**: Use `#show: rest => columns(2, rest)` for main body text if requested.
- **Bibliography**: Ensure usage of `#bibliography("refs.bib")`.

#### For Resumes / CVs
- **Setup**: Minimize margins (e.g., `margin: 1cm`).
- **Layout**: Heavily utilize `grid()` or `stack()` for alignment (e.g., Left: Skills, Right: Experience).
- **Style**: Use `#set text(font: "Roboto" or "Source Sans Pro")` for a modern look. For CJK resumes, replace with system defaults per the Font Safety Constraints.
- **Visuals**: Use `#line(length: 100%)` for separators.

#### For CJK Content (Chinese, Japanese, Korean)
- **Mandatory Font Rule**: You **must** apply the Font Safety Constraints. Use system-default fonts only (`SimSun`, `PingFang SC`, `Microsoft YaHei`, `WenQuanYi Micro Hei`) with `fallback: true`.
- **Forbidden Fonts**: Never use `"Noto Serif CJK SC"` or `"Source Han Serif SC"` unless the user explicitly confirms the font is pre-installed in the rendering environment.

### Step 3. Start creating Typst content
Generate the complete Typst document according to the above rules, ensuring all syntax is valid Typst (not LaTeX or Markdown) and all font choices comply with the Font Safety Constraints.
```

---

### Key changes made in this English version:

1. **Added the `Font Safety Constraints` section** right after `Key Principles`, making it impossible to miss.
2. **Hard-banned `"Noto Serif CJK SC"` and `"Source Han Serif SC"`** in the forbidden list.
3. **Mandated `fallback: true`** as a non-negotiable requirement for all CJK text.
4. **Replaced the Mini Example** font declaration with the safe system-default chain (`SimSun`, `PingFang SC`) instead of the old `"Noto Serif CJK SC"`.
5. **Added a CJK-specific subsection** in Step 2 to remind the model to apply font safety rules when handling Chinese content.
6. **Used strong negative constraints** (`Strictly Forbidden`, `Never`, `must not`) which are more effective for LLM behavior alignment than soft suggestions.
