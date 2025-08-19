# Phase Atomization Reference Guide

⚠️ **IMPORTANT**: This document must be referenced for ALL phase atomization work. It contains the complete methodology for making phases standalone.

## Overview

The goal is to transform eight interconnected bootcamp activities into standalone, independent modules that can be completed in any order without dependencies on previous phases.

## Core Principles

### 1. Remove Cross-Phase Content Dependencies

**Eliminate all references to previous phases in instructions and prompts:**

- **Rewrite Instructions and Intros**: Remove or reword any text mentioning completion of prior phases
  - Change: "up to now, you've done X, Y, Z" → "assuming you have some market insights and research"
  - Eliminate: "from your Phase 1 report" → "from your market research"
  - Make each phase's instructions make sense independently

- **Remove Cross-Phase Placeholder Usage**: Update prompt templates to stop pulling data from earlier phases
  - Change: `{{phase1.company_name}}` → `{{company_name}}`
  - Change: `{{phase2.benefit_keyword}}` → `{{benefit_keyword}}`
  - No phase prompts should reference `phaseN.someField` from different activities

- **Generalize or Drop Specific References**: Adjust tasks to work with generic inputs
  - Change: "Using the attached Market_Competitors.pdf" → "Using your market research (if available)"
  - Change: "citing a macro trend from Phase 1" → "citing a relevant macro trend in the market"

### 2. Add Required Fields to Each Activity

**Each phase must collect all information it needs independently:**

#### Phase-Specific Field Requirements:

**Phase 2 - Competitor Matrix:**
- Add: company_name, sector fields
- Update promptTemplate to use local fields instead of phase1 references

**Phase 3 - Background Research:**
- Add: company_name, sector, target_region, core_benefit fields
- Use same dropdown options as Phase 1 for target_region
- Replace `{{phase2.benefit_keyword}}` with local `{{core_benefit}}`

**Phase 4 - Hero Offer Design:**
- Add: company_name field (if prompt uses it)
- Update unmet need help text to not assume Phase 1 source
- Remove explicit references to "highest-scoring threat competitor(s) from Excel matrix"
- Change prompt from "{{phase1.company_name}}" to "{{company_name}}"

**Phase 5 - Brief Generation:**
- Add: chosen_concept_code_name, chosen_concept_unmet_need, concept_target_audience fields
- Remove references like "pick the concept recommended in Phase 4"
- Allow standalone concept creation/input

**Phase 6 - Implementation:**
- Add: primary_color, secondary_color fields (if prompt uses brand colors)
- Add: hero_image_theme field for describing desired imagery
- Add concept details fields if needed for marketing assets

**Phase 7 - AI Agent Setup:**
- Add: company_name field (or use team name)
- Remove dependencies on Phase 3/5 content
- Add fields for any script content previously pulled from other phases

**Phase 8 - Final Review:**
- Add: company_name field
- Add: brand_adj_1, brand_adj_2, brand_adj_3 (or comma-separated field)
- Add: concept_name, key_problem_solved, target_audience fields
- Update Handlebars template to use Phase 8's own fields
- Update Asset Checklist to not assume other phases completed

### 3. Field Configuration Standards

**All new fields should:**
- Have `persist: true` where appropriate
- Use existing field types: text, textarea, select, color
- Include helpful tooltips and help text
- Have appropriate placeholders

### 4. Revise Navigation and UI for Non-Sequential Use

**Navigation Links:**
- Ensure all phase links 1-8 are visible and clickable at all times
- Remove any logic that disables future phase links based on currentPhase
- Treat phases as independent modules rather than wizard steps

**Progress Indicators:**
- Remove "Phase X of Y" text and progress bars
- Change wording from "Phase" to "Activity" in user-facing text
- Present numbering as identifier, not progress step
- Example: "Activity 4: Hero Offer Ideation" not "Phase 4 of 8"

**Button Behavior:**
- Keep Next/Previous buttons for convenience but don't enforce progression
- Ensure no errors when navigating to phases that weren't filled
- Treat Next/Previous as navigation shortcuts, not progression enforcement

**Team Modal Logic:**
- Don't auto-open team modal based on phase sequence
- Remove dependencies like `!localStorage.getItem('phase1_data')`
- Allow anonymous usage of any phase with localStorage

### 5. Persistence and Progress Tracking

**Auto-Filling Repeat Fields:**
- Pre-populate duplicate fields from existing phase data when available
- Examples: company_name, sector, target_region, brand_colors, brand_adjectives
- Implement in client after loading allPhaseData
- User can always modify pre-filled values

**Data Storage:**
- Maintain per-phase storage in localStorage and database
- Allow duplicate field storage across phases (e.g., company_name in multiple phases)
- No changes needed to current storage mechanisms

### 6. Content Updates Checklist

For each phase atomization, verify:

**Intro Section:**
- [ ] Remove "before we..." language
- [ ] Remove "foundation of..." references
- [ ] Focus on immediate value, not preparation for future phases

**Field Tooltips:**
- [ ] Remove "this will be used in later phases"
- [ ] Remove specific phase references
- [ ] Focus on current phase value

**Decision Box Content:**
- [ ] Remove references to previous phase completion
- [ ] Update action items to be standalone

**Step-by-Step Flow:**
- [ ] Remove phase-specific file references
- [ ] Generalize file upload instructions
- [ ] Update prompt copy instructions

**Expected Output:**
- [ ] Remove "ready to proceed to Phase X" language
- [ ] Focus on standalone value
- [ ] Emphasize immediate utility

**Prompt Templates:**
- [ ] Replace all `{{phaseN.field}}` with local `{{field}}`
- [ ] Make file attachments optional
- [ ] Generalize competitor/research references

## Common Patterns to Look For

### Sequential Language to Remove:
- "Before we design anything"
- "Having completed Phase X"
- "From your Phase Y report"
- "Ready to proceed to Phase Z"
- "Foundation of your strategy"
- "Forms the basis"

### Cross-Phase Dependencies to Replace:
- `{{phase1.company_name}}` → `{{company_name}}`
- `{{phase1.sector}}` → `{{sector}}`
- `{{phase2.benefit_keyword}}` → `{{benefit_keyword}}`
- `{{phase4.brand_adj_1}}` → `{{brand_adj_1}}`
- `{{phase5.chosen_concept_code_name}}` → `{{chosen_concept_code_name}}`

### File References to Generalize:
- "Market_Competitors.pdf from Phase 1" → "your market research (if available)"
- "competitor matrix CSV from Phase 2" → "whatever competitor info you have"
- "Detailed Concept Brief from Phase 5" → "your concept details"

## Implementation Workflow

1. **Analyze Current Phase**: Identify all cross-phase dependencies
2. **Add Required Fields**: Based on prompt template needs
3. **Update Prompt Template**: Replace cross-phase references with local fields
4. **Update Content**: Remove sequential language from all sections
5. **Test Independence**: Ensure phase works without any other phase data
6. **Update Documentation**: Record changes in replit.md

## Quality Assurance

Each atomized phase should pass these tests:
- Can be started without any previous phase completion
- All prompt template variables have corresponding form fields
- No UI elements suggest required sequence
- Instructions make sense in isolation
- Expected output emphasizes standalone value
- No broken references to other phases

---
*This guide should be consulted before starting any phase atomization work to ensure consistency and completeness.*