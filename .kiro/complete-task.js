const fs = require('fs');
const path = require('path');

function completeTask(taskId, description, verification, verificationPassed = false) {
    if (!verificationPassed) {
        console.log('❌ VERIFICATION REQUIRED: Must run verification scan and pass before marking complete');
        console.log('Run: auto-verify.bat or node .kiro/verify-and-scan.js');
        return null;
    }
    const checklistPath = path.join(__dirname, 'specs', 'cook-smart', 'master-checklist.md');
    const progressPath = path.join(__dirname, 'specs', 'cook-smart', 'progress-status.json');
    
    // Load current progress
    let progress = { completedItems: [], completedCount: 0 };
    if (fs.existsSync(progressPath)) {
        progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    }
    
    // Add completion record
    const completion = {
        id: taskId,
        description: description,
        verification: verification,
        completedAt: new Date().toISOString(),
        phase: taskId.split('.')[0]
    };
    
    progress.completedItems.push(completion);
    progress.completedCount++;
    progress.lastUpdated = new Date().toISOString();
    
    // Update checklist file
    let checklist = fs.readFileSync(checklistPath, 'utf8');
    const escapedDesc = description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    checklist = checklist.replace(
        new RegExp(`- \\[ \\] ${escapedDesc}`, 'g'),
        `- [x] ${description}`
    );
    
    // Update progress stats
    const totalItems = (checklist.match(/- \[[ x]\]/g) || []).length;
    const progressPercent = Math.round((progress.completedCount / totalItems) * 100);
    
    checklist = checklist.replace(
        /\*\*Overall Progress\*\*: \d+%.*$/m,
        `**Overall Progress**: ${progressPercent}% (${progress.completedCount}/${totalItems} items completed)`
    );
    
    // Save files
    fs.writeFileSync(checklistPath, checklist);
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
    
    return {
        taskId,
        description,
        verification,
        progressPercent,
        completed: progress.completedCount,
        total: totalItems
    };
}

module.exports = { completeTask };