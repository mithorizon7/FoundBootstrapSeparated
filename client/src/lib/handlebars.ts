export function compileTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Handle Handlebars conditionals {{#if condition}} ... {{else}} ... {{/if}}
  const ifElseRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
  result = result.replace(ifElseRegex, (match, condition, ifContent, elseContent) => {
    const isTrue = evaluateCondition(condition.trim(), data);
    if (isTrue) {
      return ifContent || '';
    } else {
      return elseContent || '';
    }
  });
  
  // Handle simple variable substitution {{variableName}}
  const simpleVarRegex = /\{\{([^.}#\/]+)\}\}/g;
  result = result.replace(simpleVarRegex, (match, varName) => {
    const cleanVarName = varName.trim();
    const value = data[cleanVarName];
    return value !== undefined ? String(value) : match;
  });
  
  // Handle nested variable substitution {{phase1.company_name}}
  const nestedVarRegex = /\{\{([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\}\}/g;
  result = result.replace(nestedVarRegex, (match, objectName, propertyName) => {
    const obj = data[objectName.trim()];
    if (obj && typeof obj === 'object') {
      const value = obj[propertyName.trim()];
      return value !== undefined ? String(value) : match;
    }
    return match;
  });
  
  // Handle uppercase transformations {{COMPANY_NAME}}
  const upperVarRegex = /\{\{([A-Z_]+)\}\}/g;
  result = result.replace(upperVarRegex, (match, varName) => {
    const lowerVarName = varName.toLowerCase();
    const value = data[lowerVarName];
    return value !== undefined ? String(value) : match;
  });
  
  return result;
}

function evaluateCondition(condition: string, data: Record<string, any>): boolean {
  // Handle equality comparisons like "website_brief_approach == 'detailed'"
  const equalityMatch = condition.match(/^([a-zA-Z0-9_]+)\s*==\s*['"]([^'"]+)['"]$/);
  if (equalityMatch) {
    const [, varName, expectedValue] = equalityMatch;
    const actualValue = data[varName.trim()];
    return actualValue === expectedValue;
  }
  
  // Handle simple boolean variables
  const value = data[condition];
  return !!value;
}

export function extractVariables(template: string): string[] {
  const variables = new Set<string>();
  
  // Extract simple variables
  const simpleVarRegex = /\{\{([^.}]+)\}\}/g;
  let match;
  while ((match = simpleVarRegex.exec(template)) !== null) {
    variables.add(match[1].trim().toLowerCase());
  }
  
  // Extract nested variables
  const nestedVarRegex = /\{\{([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\}\}/g;
  while ((match = nestedVarRegex.exec(template)) !== null) {
    variables.add(`${match[1].trim()}.${match[2].trim()}`);
  }
  
  return Array.from(variables);
}
