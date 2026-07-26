
function isExamPage() {
    return window.location.href.includes('/mycourses') || 
           window.location.href.includes('/test');
}


if (isExamPage()) {
    function injectAntiDebug() {
        var sc = document.createElement('script');
        sc.src = chrome.runtime.getURL("data/inject/anti-anti-debug.js");
        sc.onload = function() {
            this.remove(); 
        };
        (document.head || document.documentElement).appendChild(sc);
    }

    
    if (document.documentElement) {
        injectAntiDebug();
    } else {
        
        const observer = new MutationObserver(function() {
            if (document.documentElement) {
                observer.disconnect();
                injectAntiDebug();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}