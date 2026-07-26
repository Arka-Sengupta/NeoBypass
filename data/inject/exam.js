// Use shared isMac variable if it exists, otherwise declare it
if (typeof window.isMac === 'undefined') {
    window.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                   navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

// Auto-answering mechanism
(function () {
  let editor;
  let codeLines = [];

  // Find the answer Ace editor on the page (only the editable answer editor)
  function findAnswerEditor() {
    // First try to find the specific answer editor by aria-labelledby
    const answerEl = document.querySelector('[aria-labelledby="editor-answer"]');
    if (answerEl) {
      try {
        return ace.edit(answerEl);
      } catch(e) {}
    }
    // Fallback: find first non-readonly ACE editor
    const editors = document.querySelectorAll('.ace_editor');
    for (const el of editors) {
      try {
        const ed = ace.edit(el);
        if (!ed.getReadOnly()) return ed;
      } catch(e) {}
    }
    return null;
  }
  // Exposed for content.js to call via inline script injection (page context)
  window._neopassStartTyping = function(codeToType) {
    if (!codeToType) return;
    console.log('[exam.js] _neopassStartTyping called, length:', codeToType.length);
    const found = findAnswerEditor();
    if (found) {
      try {
        editor = found;
        editor.setValue(codeToType);
        editor.clearSelection();
        editor.navigateFileEnd();
        console.log('[exam.js] Instantly pasted code');
      } catch (error) {
        console.error('[exam.js] Error in _neopassStartTyping:', error);
      }
    } else {
      console.error('[exam.js] No editor found for typing');
    }
  };
})();