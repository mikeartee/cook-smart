# AI ASSISTANT INSTRUCTIONS - Cook Smart Project

## 🤖 IMPORTANT: Read This First in Every New Chat Session

### Progress Tracking System
**ALWAYS use the automated progress tracking when tasks are completed and verified:**

```javascript
// When user confirms something is working, run this:
const { completeTask } = require('./.kiro/complete-task.js');
const result = completeTask("TASK_ID", "Task Description", "Verification notes");

// Then show user:
console.log(`✅ TASK COMPLETED: ${result.description}`);
console.log(`📝 Verification: ${result.verification}`);
console.log(`📊 Progress: ${result.progressPercent}% (${result.completed}/${result.total} items)`);
```

### Key Files to Reference:
- `.kiro/specs/cook-smart/master-checklist.md` - Main implementation checklist
- `.kiro/specs/cook-smart/requirements.md` - Formal requirements
- `.kiro/specs/cook-smart/progress-status.json` - Current progress data
- `.kiro/steering/project-rules.md` - Technical standards and rules
- `.kiro/specs/cook-smart/fixes-log.md` - Document successful fixes here

### Project Context:
- **App**: Cook Smart - Recipe generation app with ingredient inventory
- **Tech Stack**: React Native (no Expo), Node.js/Express, PostgreSQL, AWS
- **Status**: Planning complete, ready to build
- **Goal**: BETA for 250 users, then convert to mobile app stores

### User Expectations:
- Track progress automatically when tasks are verified working
- Follow the master checklist in order
- Test everything before moving forward
- Document fixes in fixes-log.md
- Use verified fixes before trying new solutions

### Commands User May Reference:
- "Update the Cook Smart progress tracker"
- "Mark this task complete" 
- "Track this completion"
- "That's working" or "Verified" = trigger progress update

**Always check current progress in progress-status.json to know where we are in the build process.**