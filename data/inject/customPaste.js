async function performPasteByTyping() {
    console.log('[PasteByTyping] Function called');
    
    const activeElement = document.activeElement;
    console.log('[PasteByTyping] Active element:', {
        tagName: activeElement?.tagName,
        isContentEditable: activeElement?.isContentEditable,
        id: activeElement?.id,
        className: activeElement?.className
    });

    if (!activeElement || !(activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        console.log('[PasteByTyping] No valid input element focused');
        return;
    }

    try {
        let clipText = '';
        let clipboardSource = 'none';
        
        
        try {
            clipText = await navigator.clipboard.readText();
            clipboardSource = 'native';
            console.log('[PasteByTyping] Using native clipboard:', clipText.substring(0, 100));
        } catch (clipErr) {
            console.log('[PasteByTyping] Native clipboard read failed:', clipErr.message);
        }
        
        
        if (!clipText && window.neoPassClipboard) {
            clipText = window.neoPassClipboard;
            clipboardSource = 'neoPassClipboard';
            console.log('[PasteByTyping] Using neoPassClipboard:', clipText.substring(0, 100));
        }
        
        if (!clipText) {
            console.log('[PasteByTyping] No clipboard content available from any source');
            alert('No clipboard content available. Please copy some text first.');
            return;
        }
        
        console.log('[PasteByTyping] Typing from', clipboardSource, '- Length:', clipText.length);

        
        const textToType = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '');
        
        window.isPasteByTypingActive = true;
        
        const stopTypingHandler = (e) => {
            if (e.key === 'Backspace' && window.isPasteByTypingActive) {
                console.log('[PasteByTyping] Stopping typing due to Backspace');
                window.isPasteByTypingActive = false;
            }
        };
        
        document.addEventListener('keydown', stopTypingHandler);

        try {
            
            for (let i = 0; i < textToType.length; i++) {
                if (!window.isPasteByTypingActive) {
                    break;
                }
                
                const char = textToType[i];
            
            
            if (activeElement.isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const textNode = document.createTextNode(char);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else {
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const text = activeElement.value || '';
                const newText = text.substring(0, start) + char + text.substring(end);
                activeElement.value = newText;
                activeElement.setSelectionRange(start + 1, start + 1);
            }
            
            // Dispatch input event for each character
            activeElement.dispatchEvent(new InputEvent('input', { 
                bubbles: true, 
                cancelable: true,
                inputType: 'insertText',
                data: char
            }));
            
            
            const letterDelay = Math.random() * 150 + 50; 
            await new Promise(resolve => setTimeout(resolve, letterDelay));
            
            
            if (char === ' ') {
                const wordDelay = Math.random() * 500 + 300; 
                await new Promise(resolve => setTimeout(resolve, wordDelay));
            }
            
            
            if (char === '.' || char === '!' || char === '?') {
                const sentenceDelay = Math.random() * 500 + 500; 
                await new Promise(resolve => setTimeout(resolve, sentenceDelay));
            }
        }
        
        } finally {
            document.removeEventListener('keydown', stopTypingHandler);
        }

        
        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[PasteByTyping] Typing complete');

    } catch (err) {
        console.error('[PasteByTyping] Error:', err);
    }
}

async function performDragDropPaste() {
    console.log('[DragDropPaste] Function called');
    
    const activeElement = document.activeElement;
    console.log('[DragDropPaste] Active element:', {
        tagName: activeElement?.tagName,
        isContentEditable: activeElement?.isContentEditable,
        id: activeElement?.id,
        className: activeElement?.className
    });

    if (!activeElement || !(activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        console.log('[DragDropPaste] No valid input element focused');
        return;
    }

    try {
        let clipText = '';
        let clipboardSource = 'none';
        
        
        try {
            clipText = await navigator.clipboard.readText();
            clipboardSource = 'native';
            console.log('[DragDropPaste] Using native clipboard:', clipText.substring(0, 100));
        } catch (clipErr) {
            console.log('[DragDropPaste] Native clipboard read failed:', clipErr.message);
        }
        
        
        if (!clipText && window.neoPassClipboard) {
            clipText = window.neoPassClipboard;
            clipboardSource = 'neoPassClipboard';
            console.log('[DragDropPaste] Using neoPassClipboard:', clipText.substring(0, 100));
        }
        
        if (!clipText) {
            console.log('[DragDropPaste] No clipboard content available from any source');
            alert('No clipboard content available. Please copy some text first.');
            return;
        }
        
        console.log('[DragDropPaste] Pasting from', clipboardSource, '- Length:', clipText.length);

        
        clipText = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        
        const initialValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
        const initialLength = initialValue.length;

        // Create a DataTransfer object with items
        const dataTransfer = new DataTransfer();
        
        // Add the text as both plain text and HTML
        dataTransfer.items.add(clipText, 'text/plain');
        dataTransfer.items.add(clipText, 'text/html');
        
        console.log('[DragDropPaste] DataTransfer created:', {
            types: Array.from(dataTransfer.types),
            items: dataTransfer.items.length,
            hasText: dataTransfer.types.includes('text/plain'),
            getData: dataTransfer.getData('text/plain').substring(0, 30)
        });

        
        let clientX, clientY;
        
        if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                clientX = rect.left || rect.x;
                clientY = rect.top || rect.y;
            } else {
                const rect = activeElement.getBoundingClientRect();
                clientX = rect.left + rect.width / 2;
                clientY = rect.top + rect.height / 2;
            }
        } else {
            const rect = activeElement.getBoundingClientRect();
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
        }

        
        const dragenterEvent = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dataTransfer,
            clientX: clientX,
            clientY: clientY,
            screenX: clientX,
            screenY: clientY,
            view: window
        });
        
        activeElement.dispatchEvent(dragenterEvent);

        
        const dragoverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dataTransfer,
            clientX: clientX,
            clientY: clientY,
            screenX: clientX,
            screenY: clientY,
            view: window
        });
        
        activeElement.dispatchEvent(dragoverEvent);

        
        const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dataTransfer,
            clientX: clientX,
            clientY: clientY,
            screenX: clientX,
            screenY: clientY,
            view: window
        });

        const dropResult = activeElement.dispatchEvent(dropEvent);

        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        
        const finalValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
        const finalLength = finalValue.length;
        const expectedLength = initialLength + clipText.length;
        const lengthChanged = finalLength !== initialLength;
        const lengthMatches = Math.abs(finalLength - expectedLength) <= 5; // Allow small variance for HTML

        // If drop didn't work, use fallback method
        if (!lengthChanged) {
            
            if (activeElement.isContentEditable) {
                
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(clipText);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    activeElement.dispatchEvent(new InputEvent('input', { 
                        bubbles: true, 
                        cancelable: true,
                        inputType: 'insertText',
                        data: clipText
                    }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else {
                
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const text = activeElement.value || '';
                const newText = text.substring(0, start) + clipText + text.substring(end);
                const newCursorPos = start + clipText.length;
                
                activeElement.value = newText;
                activeElement.setSelectionRange(newCursorPos, newCursorPos);
                
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
        }

    } catch (err) {
    }
}


(function() {
    
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, function(event) {
            
            const target = event.target;
            if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                event.stopPropagation();
                
                if (eventName !== 'drop') {
                    event.preventDefault();
                }
            }
        }, true); 
    });

    
    document.addEventListener('paste', function(event) {
        const target = event.target;
        if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            event.stopPropagation();
        }
    }, true);

    console.log('[CustomPaste] Drag-drop and paste events enabled');
})();


document.addEventListener('keydown', async function(event) {
    const altKey = event.altKey;
    const ctrlKey = event.ctrlKey || event.metaKey; 
    
    
    if (ctrlKey && !event.shiftKey && !event.altKey && (event.key === 'V' || event.key === 'v')) {
        const activeElement = document.activeElement;
        
        
        if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            try {
                let clipText = '';
                
                // First try native clipboard (prioritize external app copies)
                try {
                    clipText = await navigator.clipboard.readText();
                    console.log('[Paste] Using native clipboard');
                } catch (err) {
                    console.log('[Paste] Native clipboard read failed:', err.message);
                }
                
                
                if (!clipText && window.neoPassClipboard) {
                    clipText = window.neoPassClipboard;
                    console.log('[Paste] Using neoPassClipboard');
                }
                
                if (clipText) {
                    
                    clipText = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    
                    
                    const initialValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
                    const initialLength = initialValue.length;
                    
                    // Direct paste for input elements
                    if (activeElement.isContentEditable) {
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            const textNode = document.createTextNode(clipText);
                            range.insertNode(textNode);
                            range.setStartAfter(textNode);
                            range.setEndAfter(textNode);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            
                            activeElement.dispatchEvent(new InputEvent('input', { 
                                bubbles: true, 
                                cancelable: true,
                                inputType: 'insertText',
                                data: clipText
                            }));
                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else {
                        const start = activeElement.selectionStart || 0;
                        const end = activeElement.selectionEnd || 0;
                        const text = activeElement.value || '';
                        const newText = text.substring(0, start) + clipText + text.substring(end);
                        const newCursorPos = start + clipText.length;
                        
                        activeElement.value = newText;
                        activeElement.setSelectionRange(newCursorPos, newCursorPos);
                        
                        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    
                    await new Promise(resolve => setTimeout(resolve, 50));
                    const finalValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
                    const finalLength = finalValue.length;
                    
                    // If the content didn't change, fall back to typing method
                    if (finalLength === initialLength) {
                        console.log('[Paste] Direct paste failed, falling back to typing method');
                        await performPasteByTyping();
                    } else {
                        console.log('[Paste] Direct paste successful');
                    }
                }
            } catch (err) {
                console.error('[Paste] Error:', err);
                
                console.log('[Paste] Error occurred, falling back to typing method');
                await performPasteByTyping();
            }
        }
    }
    
    else if (altKey && event.shiftKey && (event.key === 'V' || event.key === 'v')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        await performDragDropPaste();
    }
}, true);