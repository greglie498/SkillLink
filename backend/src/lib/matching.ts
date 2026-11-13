export interface MatchResult {
    score: number; //0 to 100
    matchedSkills: string[];
    missingSkills: string[];
}

// Transparent skills-overllap score: matched required skills / total required skills
export function matchSkills(talentSkills: string[], requiredSkills: string[]): MatchResult {
    const have  = new Set(talentSkills.map((s) => s.toLowerCase()));
    const matchedSkills =  requiredSkills.filter((s) => have.has(s.toLowerCase()));
    const missingSkills = requiredSkills.filter((s) => !have.has(s.toLowerCase()));
    const score =
        requiredSkills.length === 0 ? 0 : Math.round((matchedSkills.length / requiredSkills.length) * 100);
    return { score, matchedSkills, missingSkills };
}