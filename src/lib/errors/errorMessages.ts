// Error message templates for different error types

interface ErrorTemplate {
  title: string;
  explanation: (details: Record<string, string>) => string;
  fixSteps: (details: Record<string, string>) => string[];
}

export const errorTemplates: Record<string, ErrorTemplate> = {
  SyntaxError: {
    title: 'Syntax Error',
    explanation: (details) => {
      if (details.message?.includes('invalid syntax')) {
        if (details.snippet?.includes('if ') || details.snippet?.includes('for ') || details.snippet?.includes('while ')) {
          return 'You forgot to add a colon (:) at the end of the if, for, while, def, or class statement.';
        }
        if (details.snippet?.includes('print') || details.snippet?.includes('(')) {
          return 'You may have forgotten to close a bracket, quote, or used an incorrect operator.';
        }
        return 'Python cannot understand the syntax of your code. Check brackets, quotes, and colons.';
      }
      
      if (details.message?.includes('indentation') || details.message?.includes('indent')) {
        return 'Incorrect indentation. In Python, indentation is crucial for code structure.';
      }
      
      if (details.message?.includes('EOL') || details.message?.includes('EOF')) {
        return 'You forgot to close a quote or bracket.';
      }
      
      return 'There is a syntax error in your code. Python cannot parse this line.';
    },
    fixSteps: (details) => {
      const steps: string[] = [];
      
      if (details.message?.includes('invalid syntax')) {
        if (details.snippet?.includes('if ') || details.snippet?.includes('for ') || details.snippet?.includes('while ')) {
          steps.push('Add a colon (:) at the end of the line');
          steps.push('Make sure the next line is indented (4 spaces or Tab)');
        } else {
          steps.push('Check that all brackets are closed: (, ), [, ], {, }');
          steps.push('Check that all quotes are closed: ", \', """');
          steps.push('Make sure you are using correct operators');
        }
      } else if (details.message?.includes('indent')) {
        steps.push('Use consistent indentation (usually 4 spaces)');
        steps.push('Do not mix spaces and tabs');
        steps.push('Make sure code blocks are properly aligned');
      } else {
        steps.push('Carefully read the line with the error');
        steps.push('Check Python syntax for the construct you are using');
      }
      
      return steps;
    },
  },

  NameError: {
    title: 'Unknown Name',
    explanation: (details) => {
      const name = details.name || 'variable';
      return `Python doesn't know what "${name}" is. You may have forgotten to create this variable or misspelled the name.`;
    },
    fixSteps: (details) => {
      const name = details.name || 'variable';
      return [
        `Check that you created the variable "${name}" before using it`,
        'Make sure there are no typos in the name (Python is case-sensitive)',
        'If this is a function, make sure you imported it or declared it earlier',
      ];
    },
  },

  TypeError: {
    title: 'Type Error',
    explanation: (details) => {
      if (details.message?.includes('not callable')) {
        return 'You are trying to call something as a function, but it is not a function.';
      }
      
      if (details.message?.includes('unsupported operand')) {
        return 'You are trying to perform an operation with incompatible data types (e.g., adding a number and a string).';
      }
      
      if (details.message?.includes('missing') && details.message?.includes('argument')) {
        return 'You called a function without a required parameter.';
      }
      
      return 'The operation cannot be performed with these data types.';
    },
    fixSteps: (details) => {
      if (details.message?.includes('not callable')) {
        return [
          'Check that you did not accidentally overwrite a function with a variable',
          'Make sure you are using the correct parentheses () to call the function',
        ];
      }
      
      if (details.message?.includes('unsupported operand')) {
        return [
          'Check the data types: use type() to verify',
          'Convert types: int() for numbers, str() for strings',
          'For example: "5" + str(10) or int("5") + 10',
        ];
      }
      
      return [
        'Check variable data types',
        'Make sure all function parameters are passed correctly',
        'Use type conversion if necessary',
      ];
    },
  },

  IndexError: {
    title: 'Index Out of Range',
    explanation: () => {
      return 'You are trying to access a list element that does not exist (index is out of bounds).';
    },
    fixSteps: () => {
      return [
        'Check the list length: use len(list)',
        'Remember: indices start at 0, not 1',
        'Make sure the index is less than len(list)',
      ];
    },
  },

  KeyError: {
    title: 'Key Not Found',
    explanation: (details) => {
      const key = details.key || 'key';
      return `You are trying to get a value by key "${key}" that does not exist in the dictionary.`;
    },
    fixSteps: (details) => {
      const key = details.key || 'key';
      return [
        `Check that the key "${key}" actually exists in the dictionary`,
        'Use the .get() method for safe access: dict.get("key")',
        'Check for the key: if "key" in dict:',
      ];
    },
  },

  ValueError: {
    title: 'Invalid Value',
    explanation: (details) => {
      if (details.message?.includes('invalid literal')) {
        return 'You are trying to convert a string to a number, but the string is not a number.';
      }
      return 'The function received a parameter with the correct type but an invalid value.';
    },
    fixSteps: (details) => {
      if (details.message?.includes('invalid literal')) {
        return [
          'Check that the string contains only digits',
          'Use try-except to handle conversion errors',
          'Example: try: num = int(string) except ValueError: print("Not a number")',
        ];
      }
      return [
        'Check the variable value before passing it to the function',
        'Read the function documentation to understand valid values',
      ];
    },
  },

  AttributeError: {
    title: 'Attribute Not Found',
    explanation: () => {
      return 'You are trying to use a method or attribute that this object does not have.';
    },
    fixSteps: () => {
      return [
        'Check the spelling of the method name',
        'Make sure the object has this method (use dir(object))',
        'Check the object type: use type(object)',
      ];
    },
  },

  ZeroDivisionError: {
    title: 'Division by Zero',
    explanation: () => {
      return 'You are trying to divide a number by zero, which is mathematically impossible.';
    },
    fixSteps: () => {
      return [
        'Check the divisor value before dividing: if divisor != 0:',
        'Make sure your calculations do not lead to division by zero',
      ];
    },
  },

  ImportError: {
    title: 'Import Error',
    explanation: (details) => {
      const module = details.module || 'module';
      return `Python cannot find the module "${module}". It may not be installed or the name is spelled incorrectly.`;
    },
    fixSteps: (details) => {
      const module = details.module || 'module';
      return [
        `Check the spelling: "${module}"`,
        'In the browser version, only built-in Python modules are available',
        'Some modules (numpy, pandas, requests) are not available in MVP',
      ];
    },
  },
};

export function getErrorTemplate(errorType: string): ErrorTemplate {
  return (
    errorTemplates[errorType] || {
      title: 'Runtime Error',
      explanation: () =>
        'An error occurred while running the program. Study the error message below.',
      fixSteps: () => [
        'Read the full error message',
        'Pay attention to the line number and description',
        'Try to find similar examples in Python documentation',
      ],
    }
  );
}
