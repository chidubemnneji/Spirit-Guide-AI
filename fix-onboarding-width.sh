#!/bin/bash
# Fixes the onboarding/welcome desktop layout being capped at 430px.
# Works regardless of whether your base color is #EBEAE5 or #F3F0E7,
# because it matches only on the structural classes, not the color.
set -e

FILE="client/src/App.tsx"

# 1. Onboarding wrapper: drop black backdrop on desktop.
#    Add md:bg variant after "bg-[#111]" in the onboarding branch (only the
#    one immediately followed by "flex justify-center").
perl -0pi -e 's/bg-\[#111\] flex justify-center/bg-[#111] md:bg-[#F3F0E7] flex justify-center/g' "$FILE"

# 2. Onboarding inner column: uncap width + drop phone shadow on desktop.
#    Target the inner div that has max-w-[430px] WITHOUT the mx-auto/pb-[64px]
#    (that distinguishes the onboarding column from the main app column).
perl -0pi -e 's/<div className="w-full max-w-\[430px\] relative bg-\[#[0-9A-Fa-f]{6}\] min-h-screen shadow-2xl overflow-hidden">/<div className="w-full max-w-[430px] md:max-w-none relative bg-[#F3F0E7] min-h-screen shadow-2xl md:shadow-none overflow-hidden">/g' "$FILE"

echo "Done. Verifying the change is present:"
grep -n "md:max-w-none relative" "$FILE" || echo "WARNING: change not found — the onboarding div may have different markup; paste App.tsx lines 70-92 to me."
