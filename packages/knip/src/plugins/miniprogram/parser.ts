import { readFileSync } from 'node:fs';

// Parse JSON configuration files
export function parseConfig<T>(filePath: string): T | null {
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Parse WXML files for dependencies
export function parseWxml(text: string, _filePath: string): string {
  const results: string[] = [];
  try {
    // Match image sources
    const imgRegex = /<image[^>]+src=["']([^"']+)["']/g;
    let match: RegExpExecArray | null = imgRegex.exec(text);
    while (match) {
      results.push(`import '${match[1]}'`);
      match = imgRegex.exec(text);
    }

    // Match template imports
    const importRegex = /<import\s+src=["']([^"']+)["']/g;
    match = importRegex.exec(text);
    while (match) {
      results.push(`import '${match[1]}'`);
      match = importRegex.exec(text);
    }

    // Match template includes
    const includeRegex = /<include\s+src=["']([^"']+)["']/g;
    match = includeRegex.exec(text);
    while (match) {
      results.push(`import '${match[1]}'`);
      match = includeRegex.exec(text);
    }

    // Match WXS module imports
    const wxsRegex = /<wxs\s+src=["']([^"']+)["']/g;
    match = wxsRegex.exec(text);
    while (match) {
      results.push(`import '${match[1]}'`);
      match = wxsRegex.exec(text);
    }

    return results.join('\n');
  } catch {
    return '';
  }
}

// Parse WXSS files for dependencies
export function parseWxss(text: string, _filePath: string): string {
  const results: string[] = [];
  try {
    // Match style imports
    const importRegex = /@import\s+["']([^"']+)["']/g;
    let match: RegExpExecArray | null = importRegex.exec(text);
    while (match) {
      results.push(`@import '${match[1]}'`);
      match = importRegex.exec(text);
    }

    return results.join('\n');
  } catch {
    return '';
  }
}

// Parse WXS files for dependencies
export function parseWxs(text: string, _filePath: string): string {
  const results: string[] = [];
  try {
    // Match require statements
    const requireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match: RegExpExecArray | null = requireRegex.exec(text);
    while (match) {
      results.push(`import '${match[1]}'`);
      match = requireRegex.exec(text);
    }

    return results.join('\n');
  } catch {
    return '';
  }
} 