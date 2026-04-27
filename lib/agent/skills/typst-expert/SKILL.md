---
name: typst-expert
description: Use the typst-author skill to help users create professional and aesthetically pleasing typst documents.You should use this skill when users request the creation of paper, resumes, novels, short stories, or notes.Be sure to follow the principles and guidelines below when creating typst document.
---

# Typst-Author skill

## When to Apply
Reference these guidelines when:
- When the content that needs modification is in Typst format
- When users need to create papers, resumes, novels
- When users insist on using the Typst format

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
below lists all markup that is available and links to the  best place to learn
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
```typ
#set page(paper: "a4", margin: 2.2cm)
#set text(font: ("New Computer Modern", "Noto Serif CJK SC"), lang: "en", size: 11pt, fallback: true)
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
## Key principles
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

### Math mode
Mathematical expressions are wrapped by `$`. Please strictly distinguish between **inline** and **block** formulas (according to `syntax.md`):

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

## How to use this skill?

### Step1. Check if the context provides a template?
Check if the context provides a template. If so, strictly follow the template in your output. You can create other content with a more professional and aesthetically pleasing approach without violating the template, but the overall content must strictly adhere to the template.

### Step2. Fully consider the needs of users
Before you start outputting the typst content, consider what the user's requirements are

#### For Academic Paper / Articles
- **Setup**: `#set page(paper: "a4", margin: (x: 2cm, y: 2.5cm))`
- **Fonts**: Use professional serif fonts (e.g., "Libertinus Serif", "New Computer Modern").
- **Columns**: Use `#show: rest => columns(2, rest)` for main body text if requested.
- **Bibliography**: Ensure usage of `#bibliography("refs.bib")`.

#### For Resumes / CVs
- **Setup**: Minimize margins (e.g., `margin: 1cm`).
- **Layout**: heavily utilize `grid()` or `stack()` for alignment (e.g., Left: Skills, Right: Experience).
- **Style**: Use `#set text(font: "Roboto" or "Source Sans Pro")` for a modern look.
- **Visuals**: Use `#line(length: 100%)` for separators.

### Step3. Start creating Typst content