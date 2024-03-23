import fs from "node:fs";
import { resolve } from "../util/path.js";
import { getTitle } from './util.js';
import type { ReporterOptions, IssueSet, IssueRecords, Issue } from '../types/issues.js';
import type { Entries } from 'type-fest';

type ExtraReporterOptions = {
  path?: string;
}

const xmlBody = (content: string, failures: number) => `
  <?xml version="1.0" encoding="UTF-8"?>
  <testsuites name="Knip" failures="${failures}">
    ${content}
  </testsuites>
`;

const testSuiteBody = (title: string, failures: number, content: string) => `
  <testsuite name="${title}" failures="${failures}">
    ${content}
  </testsuite>
`;

const testCaseBodySet = (title: string, entry: string) => `
  <testcase name="${title}" classname="${entry}">
    <failure message="${title}" type="${title}">
      ${title}: ${entry}
    </failure> 
  </testcase>
`;

const testCaseBodyEntries = (title: string, entry: string, symbol: string) => `
  <testcase name="${title}" classname="${entry}">
    <failure message="${title} - ${symbol}" type="${title}">
      ${title}: "${symbol}" inside ${entry}
    </failure> 
  </testcase>
`;

interface IssuesEntry {
  entry: string;
  issues: Issue[];
}

export default ({ report, issues, counters, options }: ReporterOptions) => {
  let totalIssues = 0;

  let xmlContent = "";
  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = getTitle(reportType);
      const count = counters[reportType];
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.entries(issues[reportType] as IssueRecords).map(([entry, errors]) => {
          const items = Object.values(errors);
          const issues = items.flatMap((item) => item.symbols ? item.symbols : { ...item });
          return { entry, issues };
      });

      if (issuesForType.length > 0) {
        let bodyCases = "";
        if (isSet) {
          const setTestCases = (issuesForType as string[]).map((issue) => {
            return testCaseBodySet(title, issue)
          }).join("");
          bodyCases += setTestCases;
        } else {
          const entriesTestCases = (issuesForType as IssuesEntry[]).flatMap((typeIssues) => typeIssues.issues.map((issue) => {
            let entry = typeIssues.entry;
            if ('line' in issue && 'col' in issue) {
              entry = `${typeIssues.entry}:${issue.line}:${issue.col}`
            }
            return testCaseBodyEntries(title, entry, issue.symbol);
          }));
          console.log(entriesTestCases);
          bodyCases += entriesTestCases.join("");
        }
        xmlContent += testSuiteBody(title, count, bodyCases)
      } 

      totalIssues += count;
    }
  }

  if (totalIssues > 0) {
    const xml = xmlBody(xmlContent, totalIssues);
    let opts: ExtraReporterOptions = {}
    try {
      opts = options ? JSON.parse(options) : opts;
    } catch (err) {
      console.error("Error occurred while parsing options:", err);
    }
    try {
      fs.writeFileSync(resolve(opts.path ?? "knip.xml"), xml);
      console.log("Knip results file successfully created.");
    } catch (err) {
      console.error("Error occurred while writing knip results file:", err);
    }
  }
};
