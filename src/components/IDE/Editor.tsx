import React, { useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  errorLine?: number;
  errorColumn?: number;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  errorLine,
  errorColumn,
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Настройка редактора
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 21,
      fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      readOnly,
    });

    // Фокус на редакторе
    editor.focus();
  };

  // Подсветка ошибочной строки
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Очистка предыдущих декораций
    if (decorationsRef.current.length > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }

    // Add new error decoration
    if (errorLine) {
      const newDecorations = editor.deltaDecorations(
        [],
        [
          {
            range: {
              startLineNumber: errorLine,
              startColumn: 1,
              endLineNumber: errorLine,
              endColumn: 1000,
            },
            options: {
              isWholeLine: true,
              className: 'error-line-highlight',
              glyphMarginClassName: 'error-line-glyph',
            },
          },
          ...(errorColumn
            ? [
                {
                  range: {
                    startLineNumber: errorLine,
                    startColumn: errorColumn,
                    endLineNumber: errorLine,
                    endColumn: errorColumn + 1,
                  },
                  options: {
                    inlineClassName: 'error-column-highlight',
                  },
                },
              ]
            : []),
        ]
      );

      decorationsRef.current = newDecorations;

      // Скролл к ошибочной строке
      editor.revealLineInCenter(errorLine);

      // Установка курсора на ошибочную позицию
      editor.setPosition({
        lineNumber: errorLine,
        column: errorColumn || 1,
      });
    }
  }, [errorLine, errorColumn]);

  const handleChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="editor">
      <MonacoEditor
        height="100%"
        language="python"
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
      />
    </div>
  );
};
