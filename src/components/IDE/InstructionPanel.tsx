import React, { useState } from 'react';
import type { Task, TaskCheckResult } from '@/types';

interface InstructionPanelProps {
  task?: Task;
  checkResult?: TaskCheckResult | null;
}

export const InstructionPanel: React.FC<InstructionPanelProps> = ({
  task,
  checkResult,
}) => {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  const revealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index]);
    }
  };

  if (!task) {
    return (
      <div className="instruction-panel">
        <div className="instruction-panel-header">
          <h3 className="instruction-panel-title">Assignment</h3>
        </div>
        <div className="instruction-panel-content">
          <div className="instruction-empty">
            <h4>Free Practice</h4>
            <p>Write any code and run it.</p>
            <p>Your teacher can set an assignment later.</p>
          </div>
        </div>
      </div>
    );
  }

  const getRequirementResult = (requirementId: string) => {
    return checkResult?.results.find((r) => r.requirementId === requirementId);
  };

  return (
    <div className="instruction-panel">
      <div className="instruction-panel-header">
        <h3 className="instruction-panel-title">Задание</h3>
      </div>

      <div className="instruction-panel-content">
        <div className="instruction-section">
          <h4 className="instruction-task-title">{task.title}</h4>
          <p className="instruction-description">{task.description}</p>
        </div>

        {(task.exampleInput || task.exampleOutput) && (
          <div className="instruction-section">
            <h5 className="instruction-subtitle">Example:</h5>
            {task.exampleInput && (
              <div className="instruction-example">
                <strong>Input:</strong>
                <pre>
                  <code>{task.exampleInput}</code>
                </pre>
              </div>
            )}
            {task.exampleOutput && (
              <div className="instruction-example">
                <strong>Expected output:</strong>
                <pre>
                  <code>{task.exampleOutput}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="instruction-section">
          <h5 className="instruction-subtitle">Requirements:</h5>
          <ul className="instruction-requirements">
            {task.requirements.map((requirement) => {
              const result = getRequirementResult(requirement.id);
              const status = result
                ? result.passed
                  ? 'passed'
                  : 'failed'
                : 'pending';

              return (
                <li key={requirement.id} className={`requirement requirement-${status}`}>
                  <span className="requirement-icon">
                    {status === 'passed' && '✓'}
                    {status === 'failed' && '✗'}
                    {status === 'pending' && '○'}
                  </span>
                  <span className="requirement-text">
                    {result?.message || requirement.description}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {checkResult && (
          <div className="instruction-section">
            <div
              className={`instruction-feedback ${checkResult.passed ? 'success' : 'partial'}`}
            >
              {checkResult.feedback}
            </div>
          </div>
        )}

        {task.hints.length > 0 && (
          <div className="instruction-section">
            <h5 className="instruction-subtitle">Hints:</h5>
            <div className="instruction-hints">
              {task.hints.map((hint, index) => (
                <div key={index} className="instruction-hint">
                  {revealedHints.includes(index) ? (
                    <div className="hint-revealed">
                      <strong>Hint {index + 1}:</strong>
                      <p>{hint}</p>
                    </div>
                  ) : (
                    <button
                      className="hint-reveal-button"
                      onClick={() => revealHint(index)}
                    >
                      💡 Show hint {index + 1}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
