"""
Extract OPPORTUNITIES data and shared types from OpportunitiesPage.tsx
into a separate data file (src/data/opportunities.ts).
"""
import re

with open('src/components/OpportunitiesPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract the imports section (up to the component code)
# We need: SupportedLanguage type import, and the lucide icons used in CATEGORIES

# Find the type definitions section
type_start = content.find("const catalogStaggerContainer")
if type_start < 0:
    type_start = content.find("type CategoryId")

if type_start < 0:
    print("ERROR: Could not find type definitions")
    exit(1)

# Extract type definitions (from type CategoryId through the lt function and pick)
# We need types: CategoryId, DirectionId, FormatId, CostId, SourceId, ParticipationId,
# SortId, RouteMode, ApplicationStatus, LText, Opportunity
# And helpers: lt(), pick()
# And exports: OPPORTUNITIES_NAV_LABELS

# Find the section from type definitions through OPPORTUNITIES_NAV_LABELS
types_end = content.find("\nexport const OPPORTUNITIES_NAV_LABELS")
if types_end < 0:
    print("ERROR: Could not find OPPORTUNITIES_NAV_LABELS")
    exit(1)

# Find the line before types section (where "import { useCmsOpportunities }" etc ends)
# We want everything after the imports, before catalogStaggerContainer

# Extract types from 'type CategoryId' through OPPORTUNITIES_NAV_LABELS
type_section = content[type_start:types_end]

# Remove catalogStaggerContainer from type section (it's component-specific)
catalog_idx = type_section.find("const catalogStaggerContainer")
if catalog_idx >= 0:
    # Find the end of catalogStaggerContainer (next top-level const after it)
    rest = type_section[catalog_idx:]
    # Count braces to find where catalogStaggerContainer ends
    depth = 0
    in_string = False
    for i, c in enumerate(rest):
        if c in '"\'':
            # Simple string check
            pass
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                # This closing brace ends catalogStaggerContainer
                # Skip to after this block (until next const or export)
                type_section = type_section[:catalog_idx] + rest[i+1:]
                break

# Also need to check what specific types are used by CATEGORIES/DIRECTIONS and OPPORTUNITIES
# Let's be safe and include all: CategoryId, DirectionId, FormatId, CostId, SourceId, 
# ParticipationId, LText, Opportunity, lt(), pick(), OPPORTUNITIES_NAV_LABELS, UI
# But NOT: catalogStaggerContainer, STORAGE_KEYS, EMPTY_FILTERS, createEmptyFilters, 
# EMPTY_QUIZ, Filters, QuizState, UserApplication, PortfolioRecord, SortId, RouteMode, ApplicationStatus

# Actually, let's keep it focused. Only what's needed for OPPORTUNITIES and OPPORTUNITIES_NAV_LABELS:
# - CategoryId, DirectionId, FormatId, CostId, SourceId, ParticipationId (used in Opportunity type)
# - LText, Opportunity types
# - lt(), pick() helpers
# - OPPORTUNITIES_NAV_LABELS
# - OPPORTUNITIES itself

# Let me find the exact range
import_start = content.find("import type { SupportedLanguage }")
types_block_start = content.find("type CategoryId")
lt_start = content.find("const lt = ")
pick_start = content.find("const pick = ")
nav_labels_start = content.find("export const OPPORTUNITIES_NAV_LABELS")
opp_start = content.find("export const OPPORTUNITIES:")

# Extract from type CategoryId to the end of the file
# Find the end of OPPORTUNITIES array (end of file)
# The array closes with ]; at the end
last_bracket = content.rfind("];")
if last_bracket > opp_start:
    data_section = content[types_block_start:last_bracket+2]
else:
    data_section = content[types_block_start:]

# Build the new data file
output = []
output.append('import type { SupportedLanguage } from "../i18n/languages";')
output.append('')
output.append('// ============================================================')
output.append('// Shared types and data for Opportunities')
output.append('// Extracted from OpportunitiesPage.tsx for lazy-loading')
output.append('// ============================================================')
output.append('')

# Add type definitions
output.append(data_section.strip())
output.append('')

# Done
result = '\n'.join(output)

with open('src/data/opportunities.ts', 'w', encoding='utf-8') as f:
    f.write(result)

print(f"Created src/data/opportunities.ts ({len(result):,} chars)")
print("Done!")
