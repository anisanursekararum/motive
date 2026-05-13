# **Product Requirement Document of Motive (Momentum and Reflective)**

# **Overview**

**Motive** (Momentum and Reflective) is a reflective productivity platform designed as a one-stop ecosystem for task management (To-do List) and emotional journaling (Notes). Unlike conventional productivity apps that focus solely on task completion, Motive utilizes Artificial Intelligence (AI) to bridge the gap between what users accomplish and how they feel.

The system's standout feature is the **ERA Cycle**, an automated summary mechanism that evaluates a user's day based on three pillars:

* **Experience (E):** Events or occurrences encountered, whether new or old, and regardless of being positive or negative.
* **Reflection (R):** The process of rethinking those events, analyzing feelings, and evaluating what transpired.
* **Action (A):** Concrete steps or decisions taken based on the insights gained to handle future situations.

# **Objective**

* **Enhance Self-Awareness:** To help users understand their productivity patterns through objective, AI-assisted daily reflections.
* **Automate Reflection:** To lower the mental barrier of journaling by condensing extensive notes and task lists into strategic, actionable insights (**ERA Cycle**).
* **Data Security & Cost-Efficiency:** To build a robust yet operationally affordable system by maximizing local infrastructure and Google Cloud’s free-tier services (Firebase, Gemini AI, and Cloud Functions).
* **Flexible Task Management:** To provide an organized task management tool that supports categorization and prioritization, ensuring users stay focused on what matters most.

# **Target user**

* **Self-Development & Reflective Individuals:** Users accustomed to manual journaling who seek a more structured, data-driven method to understand their productivity patterns.
* **Automation Seekers:** Individuals who face mental barriers with manual journaling and require AI assistance to automatically condense their day into strategic action plans.
* **Target-Oriented Professionals:** Users managing tasks across multiple domains (Work, Study, Personal, Self Development, Homes, Health) who need an automated way to evaluate obstacles (*urgent cases*) and time management.

# **Functional Requirements**

## **Detailed Task Management**

* **Time-Tracking:** Every task must include a `deadline` attribute and a `completedAt` timestamp (automatically recorded when the status changes to "completed").
* **Priority & Categorization:** Maintain the use of categories and priority levels (High, Medium, Low).

## **Multi-Notes & Journal Validation**

* **Multi-Input:** The system supports multiple note entries within a single day.
* **Character Limit:** A maximum limit of 5,000 characters per journal entry. The system must provide a character count indicator and block input if the limit is exceeded.

## **AI Summarizer (Context-Aware)**

* **Daily Aggregation:** If there are multiple notes in a day, the AI will aggregate all note texts and the entire to-do list for that day to generate a single **ERA summary**.
* **Date Range Analysis:** Users can select a specific date range (e.g., 1 week). The AI will analyze trends across all tasks and notes within that range to provide periodic progress reports.

## **Data Portability & Backup**

* **Export Data:** Users can download all their data (tasks, notes, summaries) in `.json` format.
* **Import Data:** Users can re-upload the `.json` file to the application to restore data into **IndexedDB** after a cache clear or browser switch.

# **Technical Specification**

## **Frontend Stack**

* **Core Library:** React.js.
* **State Management:** React Context or `useReducer` to synchronize the UI and **IndexedDB**.
* **Input Handling:** Implementation of input controls for 5,000-character limit validation.

## **Storage & Data Handling**

* **IndexedDB (via Dexie.js):** Local database remains the primary storage.
* **Export/Import Logic:** Using `JSON.stringify` for exports and `JSON.parse` with schema validation for data imports.

## **Backend & AI (Gemini Integration)**

* **Prompt Engineering:** Instructions to Gemini AI will include context such as: *"The following is a combination of \[X\] notes and \[Y\] tasks for today..."* or *"The following is data from the date range \[Start\] to \[End\]..."*
* **Cloud Functions:** Node.js functions to process email delivery via Resend/SendGrid and act as an API Proxy for Gemini.

## **JSON Data Structure**

{  
"tasks": \[  
{  
"id": "uuid-123",  
"title": "Investigate Bug",  
"status": "completed",  
"deadline": "2026-05-06T18:00:00Z",  
"completedAt": "2026-05-06T17:45:00Z"  
}  
\],  
"daily\_notes": \[  
{  
"id": "note-001",  
"content": "Pagi ini merasa sangat fokus...",  
"charCount": 250,  
"timestamp": "2026-05-06T08:00:00Z"  
},  
{  
"id": "note-002",  
"content": "Materi JuaraVibeCoding ternyata sulit di bagian Cloud Functions...",  
"charCount": 1200,  
"timestamp": "2026-05-06T21:00:00Z"  
}  
\]  
}

# **Design guideline**

## **Brand & Style**

   The design system is rooted in the “Reflective Precision” style—a blend of Corporate Modern and Minimalist aesthetics. It is designed for high-focus environments where clarity of thought is paramount. The system prioritizes functional whitespace and a structured information hierarchy to reduce cognitive load. The emotional response should be one of calm confidence. By utilizing a deep, trustworthy color palette and disciplined geometry, the UI recedes to let the user’s content and reflections take center stage. Every element serves a purpose; ornamentation is discarded in favor of utility and professional approachability.

## **Colors**

   The palette is anchored by Motive Dark Blue, which provides an authoritative foundation for the design system.

* Primary Action: Use Motive Dark Blue (\#2E3A8C) for primary buttons, active states, and brand-critical elements.
* Accent & Interaction: Motive Light Blue (\#4A5FD9) is reserved for interactive hovers, focus rings, and soft accents that guide the user’s eye without overwhelming them.
* Depth: Motive Navy (\#1A2254) is utilized for high-contrast dark backgrounds, sidebars, or footer areas to create a sense of containment.
* Neutrals: The background uses a cool Light Gray (\#F5F7FA) to differentiate from the pure White (\#FFFFFF) elevated card surfaces. Typography utilizes a tiered grayscale—Black (\#1A1A1A) for hierarchy and Dark Gray (\#4A4A4A) for sustained reading.

## **Typography**

   The design system exclusively employs Inter to achieve a neutral, systematic, and highly legible interface.

* Headlines: Use Bold (700) for H1 and Semi-Bold (600) for H2-H3. Tighten letter spacing slightly on larger headings to maintain a modern, “compact” feel.
* Body Text: Use Regular (400) for all long-form content. The line height is set generously at 1.5x the font size to ensure a comfortable reflective reading experience.
* Labels: Use Semi-Bold or Bold for UI labels, tags, and button text to provide a clear contrast against body copy

## **Layout & Spacing**

   This design system uses a Fixed Grid approach for desktop to preserve the focus-centric nature of the application, transitioning to a fluid layout for mobile 1 devices.

* Grid: A 12-column grid with a 24px gutter. The maximum content width is 1200px.
* Rhythm: An 8px base unit governs all spatial relationships.
* Breakpoints:
   * Desktop (1024px+): Full 12-column grid with 48px+ side margins.
   * Tablet (768px \- 1023px): 8-column grid with 24px margins.
   * Mobile (0px \- 767px): 4-column fluid grid with 16px margins.

## **Elevation & Depth**

   Hierarchy is established through Ambient Shadows and Tonal Layering. Instead of heavy borders, the design system relies on subtle depth to distinguish between the background and interactive surfaces.

* Level 0 (Background): Light Gray (\#F5F7FA), flat.
* Level 1 (Cards/Containers): White (\#FFFFFF) with a 0px 2px 8px rgba(0,0,0,0.08) shadow. This is the primary surface for content.
* Level 2 (Overlays/Modals): White (\#FFFFFF) with a more pronounced 0px 8px 24px rgba(0,0,0,0.12) shadow to indicate temporary focus.  
   Avoid inner shadows or heavy gradients. Depth should feel natural, as if soft light is hitting the interface from directly above.

## **Shapes**

   The shape language is consistently Rounded, striking a balance between the precision of a professional tool and the approachability of a personal reflection system.

* Actionable Elements: Buttons and form inputs use an 8px radius. This provides a clean, modern look that fits perfectly within the 8px spacing grid.
* Container Elements: Cards and main content areas use a larger 12px radius. This “soft nesting” effect makes the interface feel organized and structured.
* Consistency: Do not use fully pill-shaped buttons unless they are small utility tags or chips.

## **Components**

**Buttons**

* Primary: Motive Dark Blue background, White text, 8px radius.
* Secondary: Transparent background, Motive Dark Blue border (1px) and text.
* Hover State: Transition background/border to Motive Light Blue

**Cards**

* Always White (\#FFFFFF) with 12px radius and the Level 1 subtle shadow.
* Internal padding should follow the md (24px) spacing unit for a breathable layout.

**Input Fields**

* 8px radius, Light Gray border (1px).
* On focus: Border changes to Motive Light Blue with a subtle 2px outer glow of the same color at 20% opacity.

**Chips & Tags**

* Used for categorization. Use a light tint of Motive Dark Blue (10% opacity) with the Semi-Bold text color for high legibility. 16px height with a 4px radius.

**Lists**

* Use subtle dividers (1px, \#F5F7FA) between list items.
* Hover states for list items should use a very faint gray background to indicate interactivity without breaking the visual flow.

**Reflection Specifics**

* Quote Blocks: Use a 4px left-border of Motive Light Blue to highlight reflective insights within body text.
* Progress Indicators: Use thin, 4px height bars with Motive Light Blue for “Active” and Motive Navy for “Completed” states.