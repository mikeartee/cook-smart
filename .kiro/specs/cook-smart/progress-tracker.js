#!/usr/bin/env node

/**
 * Cook Smart Progress Tracker
 * Automatically updates checklist progress and maintains completion status
 */

const fs = require('fs');
const path = require('path');

class ProgressTracker {
    constructor() {
        this.checklistPath = path.join(__dirname, 'master-checklist.md');
        this.progressPath = path.join(__dirname, 'progress-status.json');
        this.loadProgress();
    }

    loadProgress() {
        try {
            if (fs.existsSync(this.progressPath)) {
                this.progress = JSON.parse(fs.readFileSync(this.progressPath, 'utf8'));
            } else {
                this.progress = {
                    completedItems: [],
                    currentPhase: 1,
                    totalItems: 0,
                    completedCount: 0,
                    lastUpdated: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            this.progress = { completedItems: [], currentPhase: 1, totalItems: 0, completedCount: 0 };
        }
    }

    saveProgress() {
        this.progress.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.progressPath, JSON.stringify(this.progress, null, 2));
    }

    markComplete(itemId, description, verificationNotes = '') {
        const timestamp = new Date().toISOString();
        const completionRecord = {
            id: itemId,
            description: description,
            completedAt: timestamp,
            verificationNotes: verificationNotes,
            phase: this.getCurrentPhase(itemId)
        };

        // Add to completed items if not already there
        if (!this.progress.completedItems.find(item => item.id === itemId)) {
            this.progress.completedItems.push(completionRecord);
            this.progress.completedCount++;
        }

        this.updateChecklistFile();
        this.saveProgress();
        
        console.log(`✅ Marked complete: ${description}`);
        console.log(`📝 Verification: ${verificationNotes}`);
        this.displayProgress();
    }

    getCurrentPhase(itemId) {
        // Extract phase number from item ID (e.g., "1.1.1" -> Phase 1)
        const phaseMatch = itemId.match(/^(\d+)\./);
        return phaseMatch ? parseInt(phaseMatch[1]) : 1;
    }

    updateChecklistFile() {
        try {
            let content = fs.readFileSync(this.checklistPath, 'utf8');
            
            // Update checkboxes for completed items
            this.progress.completedItems.forEach(item => {
                const escapedDescription = item.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const checkboxPattern = new RegExp(`- \\[ \\] ${escapedDescription}`, 'g');
                content = content.replace(checkboxPattern, `- [x] ${item.description}`);
            });

            // Update progress tracking section
            const totalItems = (content.match(/- \[[ x]\]/g) || []).length;
            const completedItems = this.progress.completedCount;
            const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            
            // Update the progress section
            const progressSection = `**Completed Phases**: ${this.getCompletedPhases()}/10
**Current Phase**: Phase ${this.progress.currentPhase} - ${this.getCurrentPhaseName()}
**Overall Progress**: ${progressPercent}% (${completedItems}/${totalItems} items completed)
**Last Updated**: ${new Date().toLocaleString()}`;

            content = content.replace(
                /\*\*Completed Phases\*\*:.*?\*\*Last Updated\*\*:.*?$/ms,
                progressSection
            );

            fs.writeFileSync(this.checklistPath, content);
            
            // Update our internal tracking
            this.progress.totalItems = totalItems;
            
        } catch (error) {
            console.error('Error updating checklist file:', error);
        }
    }

    getCompletedPhases() {
        const phaseCompletions = {};
        this.progress.completedItems.forEach(item => {
            phaseCompletions[item.phase] = (phaseCompletions[item.phase] || 0) + 1;
        });
        
        // Count phases that are fully complete (this would need phase item counts)
        return Object.keys(phaseCompletions).length;
    }

    getCurrentPhaseName() {
        const phaseNames = {
            1: "Foundation & Infrastructure",
            2: "User Authentication & Core Database", 
            3: "Core Ingredient & Recipe System",
            4: "Recipe Generation & Filtering",
            5: "Shopping List & User Features",
            6: "Discord Integrations",
            7: "Monetization & Pre-Purchase",
            8: "Admin Dashboard",
            9: "BETA Preparation & Testing",
            10: "Launch & Monitoring"
        };
        return phaseNames[this.progress.currentPhase] || "Unknown Phase";
    }

    displayProgress() {
        console.log('\n📊 COOK SMART PROGRESS TRACKER');
        console.log('================================');
        console.log(`Current Phase: ${this.progress.currentPhase} - ${this.getCurrentPhaseName()}`);
        console.log(`Completed Items: ${this.progress.completedCount}/${this.progress.totalItems}`);
        console.log(`Progress: ${Math.round((this.progress.completedCount / this.progress.totalItems) * 100)}%`);
        console.log(`Last Updated: ${new Date(this.progress.lastUpdated).toLocaleString()}\n`);
    }

    listRecentCompletions(count = 5) {
        const recent = this.progress.completedItems
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, count);
            
        console.log('\n🎯 RECENT COMPLETIONS');
        console.log('====================');
        recent.forEach(item => {
            console.log(`✅ ${item.description}`);
            console.log(`   Phase ${item.phase} | ${new Date(item.completedAt).toLocaleString()}`);
            if (item.verificationNotes) {
                console.log(`   📝 ${item.verificationNotes}`);
            }
            console.log('');
        });
    }

    getNextTasks(count = 3) {
        // This would analyze the checklist and suggest next logical tasks
        console.log('\n🎯 SUGGESTED NEXT TASKS');
        console.log('=======================');
        console.log('1. Initialize React Native project (no Expo)');
        console.log('2. Set up TypeScript configuration');
        console.log('3. Configure ESLint and Prettier');
        console.log('');
    }
}

// CLI Interface
if (require.main === module) {
    const tracker = new ProgressTracker();
    const command = process.argv[2];
    
    switch (command) {
        case 'complete':
            const itemId = process.argv[3];
            const description = process.argv[4];
            const notes = process.argv[5] || '';
            if (itemId && description) {
                tracker.markComplete(itemId, description, notes);
            } else {
                console.log('Usage: node progress-tracker.js complete <itemId> "<description>" "<verification notes>"');
            }
            break;
            
        case 'status':
            tracker.displayProgress();
            tracker.listRecentCompletions();
            tracker.getNextTasks();
            break;
            
        case 'recent':
            tracker.listRecentCompletions(parseInt(process.argv[3]) || 5);
            break;
            
        default:
            console.log('Cook Smart Progress Tracker');
            console.log('Commands:');
            console.log('  complete <itemId> "<description>" "<notes>" - Mark item as complete');
            console.log('  status - Show current progress');
            console.log('  recent [count] - Show recent completions');
    }
}

module.exports = ProgressTracker;