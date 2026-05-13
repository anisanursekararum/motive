# System Instructions: Reflective Productivity System

## Project Overview

Build a **Reflective Productivity System**. System have two input, first is tasks basically user can create to-do list of today's tasks and mark as checked when is done or completed. They can also clasify task into categorie and priority level. Second input is notes where user can write everything that comes to their mind. Basically they can journal or just write random things of they today's feelings. System have button to process to-do list and notes using AI. AI will read all tasks and notes and generate a summary of the day with ERA Cycle format which means what user had accomplished (E), what are the challenges they faced (R), and what they plan to do tomorrow to improve or maintain their progress (A). Once it is generated, they can send the summary to their email. Each user have their own private storage for tasks and notes. So AI should only read the tasks and notes of the logged in user. User can check their habit by select date and AI will generate summary of that day based on historical data. Make sure all data privacy and security are safe and encrypted from other users.

---

## Navigation Structure

### Top Navigation Tabs
- Today's To-do List
- Today's Notes
- Reports (data history of to-do list, notes, and summary, trends and charts)
- Settings

### Header Elements
- Dark/Light mode toggle
- Search
- User profile with name and avatar

---

### Today's To-do List
- User can add and edit to-do list in here
- For each to-do list, display:
  - Title
  - Description
  - Category
  - Priority
  - Due date
- Checked when completed or done

---

### Today's Notes
- Big text area, user can write long sentences or paragraph or just simple one.
---

### Reports Page
- Full list of all historical data ordering by generated date
- Search by anything match keywords
- Filter by date range (custom date picker)
- Show only last 10 generated data if no date range selected

---

### Settings Page
- User can edit their profile
- User can change their password
- User can change their email as recipient of generated summary

---

## Data Model

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string | null",
  "createdAt": "timestamp"
}
```

### Task
```json
{
  "id": "string",
  "type": "todo | note",
  "title": "string",
  "description": "string",
  "category": "string",
  "priority": "high | medium | low",
  "status": "completed | incomplete",
  "date": "timestamp",
  "createdAt": "timestamp"
}
```

### Note
```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "createdAt": "timestamp"
}
```

### Summary
```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "createdAt": "timestamp"
}
```

### Category
```json
{
  "id": "string",
  "name": "string",
  "type": "todo | note",
  "icon": "string"
}

```

## Default Categories

### Todo Categories
- Work
- Study
- Personal
- Self Development
- Health & Fitness
- Other

---

### Priority Categories
- High
- Medium
- Low

---

## Core Functionalities

### Task Management
- Create new task/todo
- Edit existing task/todo
- Delete task/todo
- Categorize task/todo
- Mark as completed or done

### Notes Journaling
- Write free text note

### AI Summarizer
- Automatically summarize all tasks/todos and notes
- Generate ERA Cycle summary (Accomplished, Challenges, Action plan)
- Save summary to database or local storages
- Send summary to email
- User can check their habit by select date and AI will generate summary of that day based on historical data.

---

## Features for MVP

- Generate ERA Cycle summary (Accomplished, Challenges, Action plan)
- Save summary to database or local storages
- Send summary to email
- User can check their habit by select date and AI will generate summary of that day based on historical data.
- Local data storage

## Features to Exclude from MVP

- Cloud sync and backup
- Email integration
- Security and data privacy

---

## Technical Requirements

### Data Storage
- Persist all data locally (localStorage or IndexedDB. I want everything are safe and encrypted)
- Data should survive browser refresh
- Structure data for potential future cloud migration
- Using IndexedDB for local storage.

### Charts
- Interactive charts with tooltips
- Responsive sizing
- Time period filtering

### Forms
- Input validation on all forms
- Error messages for invalid inputs
- Confirmation dialogs for delete actions

### Performance
- Fast load times
- Smooth interactions
- Handle 1000+ transactions without lag


