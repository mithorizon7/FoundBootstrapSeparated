# Phase Configuration Files

This directory contains the JSON configuration files for each of the 8 bootcamp phases/activities.

## ⚠️ IMPORTANT - Before Modifying Any Phase Configuration

**ALWAYS REFERENCE** `../docs/atomization-guide.md` before making any changes to phase configurations.

The atomization guide contains:
- Complete methodology for making phases standalone
- Required field patterns for each phase
- Content update checklists
- Common patterns to remove/replace
- Quality assurance tests

## Phase Configuration Structure

Each `phase-N.json` file contains:
- `phase`: Phase number (1-8)
- `title`: Display title for the phase
- `intro`: Introduction text shown to users
- `estimatedTime`: Expected completion time
- `fields`: Form fields for user input
- `promptTemplate`: AI prompt template with placeholders
- `decisionBoxContent`: Structured guidance content
- `stepByStepFlow`: Detailed workflow steps
- `expectedOutput`: Information about outputs and next steps

## Atomization Status

- ✅ Phase 1: Market Research - Fully atomized
- ✅ Phase 2: Competitor Matrix - Fully atomized  
- ⏳ Phase 3-8: Pending atomization

## Field Naming Conventions

When adding fields for atomization:
- Use consistent IDs across phases (e.g., `company_name`, `sector`)
- Include `persist: true` for data that should be saved
- Add helpful tooltips and help text
- Use descriptive placeholders

## Cross-Phase Reference Removal

Replace these patterns:
- `{{phase1.company_name}}` → `{{company_name}}`
- `{{phase2.benefit_keyword}}` → `{{benefit_keyword}}`
- `{{phaseN.field}}` → `{{field}}`

See the atomization guide for complete patterns and methodology.