"use client";

import React, { useRef, useEffect, useState } from 'react';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe aquí...",
  rows = 3,
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Actualizar el contenido del editor cuando cambia el valor externo
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
      const text = editorRef.current.innerText || editorRef.current.textContent || '';
      setIsEmpty(text.trim() === '');
    }
  }, [value]);

  // Verificar el estado de formato cuando cambia la selección
  const checkFormat = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    // Buscar el elemento padre más cercano
    let element = commonAncestor.nodeType === Node.TEXT_NODE
      ? commonAncestor.parentElement
      : commonAncestor as Element;

    while (element && element !== editorRef.current) {
      if (element.tagName === 'B' || element.tagName === 'STRONG') {
        setIsBold(true);
        break;
      }
      element = element.parentElement as Element;
    }
    if (!element || element === editorRef.current) {
      setIsBold(false);
    }

    element = commonAncestor.nodeType === Node.TEXT_NODE
      ? commonAncestor.parentElement
      : commonAncestor as Element;

    while (element && element !== editorRef.current) {
      if (element.tagName === 'I' || element.tagName === 'EM') {
        setIsItalic(true);
        break;
      }
      element = element.parentElement as Element;
    }
    if (!element || element === editorRef.current) {
      setIsItalic(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Interceptar Enter para insertar <br> en lugar de crear div/p
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      handleInput();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;

      // Normalizar: convertir div y p vacíos a br, y preservar br existentes
      // Reemplazar <div><br></div> o <p><br></p> por <br>
      html = html.replace(/<(div|p)[^>]*>\s*<br\s*\/?>\s*<\/\1>/gi, '<br>');
      // Reemplazar <div></div> o <p></p> vacíos por <br>
      html = html.replace(/<(div|p)[^>]*>\s*<\/\1>/gi, '<br>');
      // Convertir </div> y </p> seguidos de <div> o <p> a <br>
      html = html.replace(/<\/(div|p)>\s*<(div|p)[^>]*>/gi, '<br>');

      const text = editorRef.current.innerText || editorRef.current.textContent || '';
      setIsEmpty(text.trim() === '');
      onChange(html);
    }
  };

  const handleSelectionChange = () => {
    checkFormat();
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
    checkFormat();
  };

  const toggleBold = () => {
    execCommand('bold');
  };

  const toggleItalic = () => {
    execCommand('italic');
  };

  const toggleBulletList = () => {
    execCommand('insertUnorderedList');
  };

  const toggleOrderedList = () => {
    execCommand('insertOrderedList');
  };

  const fontSizes = [
    { label: 'Pequeño', value: '12px' },
    { label: 'Normal', value: '14px' },
    { label: 'Grande', value: '18px' },
  ];

  const applyFontSize = (size: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      try {
        range.surroundContents(span);
      } catch (e) {
        console.error('Font size apply error:', e);
        // Si falla, crear un nuevo span y envolver el contenido
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      editorRef.current?.focus();
      handleInput();
    }
  };

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 ${className}`}>
      {/* Barra de herramientas */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        {/* Botón Negrita */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleBold}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${isBold
            ? 'bg-brand-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          title="Negrita"
        >
          <strong>B</strong>
        </button>

        {/* Botón Cursiva */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleItalic}
          className={`px-3 py-1.5 rounded text-sm italic transition-colors ${isItalic
            ? 'bg-brand-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          title="Cursiva"
        >
          <em>I</em>
        </button>

        {/* Botón Lista Viñetas */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleBulletList}
          className="px-3 py-1.5 rounded text-sm transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Lista con viñetas"
        >
          •
        </button>

        {/* Botón Lista Numerada */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleOrderedList}
          className="px-3 py-1.5 rounded text-sm transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Lista numerada"
        >
          1.
        </button>

        {/* Selector de tamaño */}
        <div className="flex items-center gap-1 ml-2">
          <label className="text-xs text-gray-600 dark:text-gray-400">Tamaño:</label>
          <select
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (e.target.value) {
                applyFontSize(e.target.value);
                e.target.value = ''; // Reset para permitir seleccionar el mismo tamaño
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            defaultValue=""
          >
            <option value="">Seleccionar</option>
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
        {/* Selector de color */}
        <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
          {/* Rojo */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCommand('foreColor', '#ef4444')}
            className="w-6 h-6 rounded bg-red-500 hover:ring-2 hover:ring-offset-1 hover:ring-red-500 transition-all"
            title="Texto Rojo"
          />
          {/* Azul */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCommand('foreColor', '#3b82f6')}
            className="w-6 h-6 rounded bg-blue-500 hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all"
            title="Texto Azul"
          />
          {/* Verde */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCommand('foreColor', '#22c55e')}
            className="w-6 h-6 rounded bg-green-500 hover:ring-2 hover:ring-offset-1 hover:ring-green-500 transition-all"
            title="Texto Verde"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 text-gray-900 dark:text-white focus:outline-none"
          style={{
            minHeight: `${rows * 1.5}rem`,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
          suppressContentEditableWarning
        />
        {isEmpty && (
          <div
            className="absolute top-2 left-3 text-gray-400 pointer-events-none"
            style={{ fontSize: '0.875rem' }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Estilos globales para el editor */}
      <style dangerouslySetInnerHTML={{
        __html: `
        [contenteditable]:focus {
          outline: none;
        }
        ul { list-style-type: disc; margin-left: 20px; }
        ol { list-style-type: decimal; margin-left: 20px; }
      `}} />
    </div >
  );
};

export default SimpleRichTextEditor;

