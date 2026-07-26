
if (typeof window.isMac === 'undefined') {
    window.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                   navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}


(function () {
  let editor;
  let codeLines = [];

  
  function findAnswerEditor() {
    
    const answerEl = document.querySelector('[aria-labelledby="editor-answer"]');
    if (answerEl) {
      try {
        return ace.edit(answerEl);
      } catch(e) {}
    }
    
    const editors = document.querySelectorAll('.ace_editor');
    for (const el of editors) {
      try {
        const ed = ace.edit(el);
        if (!ed.getReadOnly()) return ed;
      } catch(e) {}
    }
    return null;
  }
  
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