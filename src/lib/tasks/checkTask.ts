import type {
  Task,
  TaskCheckResult,
  RequirementResult,
  TaskRequirement,
} from '@/types';

/**
 * Checks task completion
 */
export function checkTask(
  task: Task,
  code: string,
  output: string
): TaskCheckResult {
  const results: RequirementResult[] = [];
  let passedCount = 0;

  for (const requirement of task.requirements) {
    const result = checkRequirement(requirement, code, output);
    results.push(result);
    if (result.passed) {
      passedCount++;
    }
  }

  const passed = passedCount === task.requirements.length;
  const feedback = generateFeedback(passed, passedCount, task.requirements.length);

  return {
    passed,
    results,
    feedback,
  };
}

/**
 * Checks a single requirement
 */
function checkRequirement(
  requirement: TaskRequirement,
  code: string,
  output: string
): RequirementResult {
  switch (requirement.type) {
    case 'outputContains':
      return checkOutputContains(requirement, output);
    case 'functionExists':
      return checkFunctionExists(requirement, code);
    case 'variableExists':
      return checkVariableExists(requirement, code);
    case 'maxLines':
      return checkMaxLines(requirement, code);
    default:
      return {
        requirementId: (requirement as any).id || 'unknown',
        passed: false,
        message: 'Unknown requirement type',
      };
  }
}

/**
 * Check: output contains text
 */
function checkOutputContains(
  requirement: { id: string; value: string; caseSensitive?: boolean },
  output: string
): RequirementResult {
  const searchValue = requirement.caseSensitive
    ? requirement.value
    : requirement.value.toLowerCase();
  const searchOutput = requirement.caseSensitive
    ? output
    : output.toLowerCase();

  const passed = searchOutput.includes(searchValue);

  return {
    requirementId: requirement.id,
    passed,
    message: passed
      ? `✓ Output contains "${requirement.value}"`
      : `✗ Output does not contain "${requirement.value}"`,
  };
}

/**
 * Check: function exists
 */
function checkFunctionExists(
  requirement: { id: string; functionName: string },
  code: string
): RequirementResult {
  // Simple regex check (use AST parser in production)
  const defPattern = new RegExp(
    `def\\s+${escapeRegex(requirement.functionName)}\\s*\\(`,
    'gm'
  );
  const asyncDefPattern = new RegExp(
    `async\\s+def\\s+${escapeRegex(requirement.functionName)}\\s*\\(`,
    'gm'
  );

  const passed = defPattern.test(code) || asyncDefPattern.test(code);

  return {
    requirementId: requirement.id,
    passed,
    message: passed
      ? `✓ Function ${requirement.functionName}() is defined`
      : `✗ Function ${requirement.functionName}() not found`,
  };
}

/**
 * Check: variable exists
 */
function checkVariableExists(
  requirement: { id: string; variableName: string },
  code: string
): RequirementResult {
  // Simple regex check
  // Look for: variable_name = ...
  const assignPattern = new RegExp(
    `^${escapeRegex(requirement.variableName)}\\s*=`,
    'gm'
  );

  const passed = assignPattern.test(code);

  return {
    requirementId: requirement.id,
    passed,
    message: passed
      ? `✓ Variable ${requirement.variableName} is declared`
      : `✗ Variable ${requirement.variableName} not found`,
  };
}

/**
 * Check: code does not exceed maximum line count
 */
function checkMaxLines(
  requirement: { id: string; maxLines: number },
  code: string
): RequirementResult {
  const lines = code.split('\n').filter((line) => {
    const trimmed = line.trim();
    // Ignore empty lines and comments
    return trimmed.length > 0 && !trimmed.startsWith('#');
  });

  const lineCount = lines.length;
  const passed = lineCount <= requirement.maxLines;

  return {
    requirementId: requirement.id,
    passed,
    message: passed
      ? `✓ Code has ${lineCount} lines (limit: ${requirement.maxLines})`
      : `✗ Code has ${lineCount} lines (limit: ${requirement.maxLines})`,
  };
}

/**
 * Generates feedback message
 */
function generateFeedback(
  passed: boolean,
  passedCount: number,
  totalCount: number
): string {
  if (passed) {
    return '🎉 Excellent! All requirements met!';
  }

  const percentage = Math.round((passedCount / totalCount) * 100);

  if (percentage >= 80) {
    return `Almost there! Completed ${passedCount} of ${totalCount} requirements. Keep going!`;
  } else if (percentage >= 50) {
    return `Good progress! Completed ${passedCount} of ${totalCount} requirements. Continue!`;
  } else if (percentage > 0) {
    return `Completed ${passedCount} of ${totalCount} requirements. Review the task again.`;
  } else {
    return `No requirements met. Read the task carefully and try again.`;
  }
}

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
