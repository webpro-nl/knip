import {
  SymbolIssueNames,
  type SymbolIssues,
  type SymbolIssueType,
} from "../../src/types/issues.js";

/**
 * Returns true if there are no issues reported (ignoring the excluded issue types).
 */
export const noIssuesReported = (
  issues: SymbolIssues,
  excludedIssueTypes: SymbolIssueType[] = []
): boolean => {
  for (const symbolType of Object.values(SymbolIssueNames)) {
    if (symbolType in issues && !excludedIssueTypes.includes(symbolType)) {
      if (Object.keys(issues[symbolType]).length !== 0) {
        return false;
      }
    }
  }

  // All issues (that were not excluded) were empty
  return true;
};
