(function() {
    
    if (window.location.href.toLowerCase().includes('youtube') || 
        window.location.href.toLowerCase().startsWith('chrome://')) {
        
        console.log('Script not running on restricted page');
        return;
    }

    

    
    const originalFetch = window.fetch;
    
    
    window.fetch = async function (...args) {
        let url = args[0];
        const options = args[1];

        try {
            if (typeof url === 'string') {
                
                const isExtensionRequest = url.startsWith('chrome-extension://') || 
                                          url.includes('deojfdehldjjfmcjcfaojgaibalafifc');
                
                if (isExtensionRequest) {
                    
                    
                    
                    if (url.includes('manifest.json')) {
                        console.log('🎯 Redirecting mock_manifest.json request from:', url);
                        
                        url = url.replace(/manifest\.json$/, 'data/inject/mock_code/mock_manifest.json');
                        console.log('   → Redirected to:', url);
                    }
                    else if (url.includes('minifiedBackground.js')) {
                        console.log('🎯 Redirecting minifiedBackground.js request from:', url);
                        url = url.replace(/minifiedBackground\.js$/, 'data/inject/mock_code/minifiedBackground.js');
                        console.log('   → Redirected to:', url);
                    }
                    else if (url.includes('minifiedContent-script.js') || url.includes('minifiedContent.js')) {
                        console.log('🎯 Redirecting minifiedContent-script.js request from:', url);
                        url = url.replace(/minifiedContent(?:-script)?\.js$/, 'data/inject/mock_code/minifiedContent-script.js');
                        console.log('   → Redirected to:', url);
                    }
                    else if (url.includes('rules.json')) {
                        console.log('🎯 Redirecting rules.json request from:', url);
                        url = url.replace(/rules\.json$/, 'data/inject/mock_code/rules.json');
                        console.log('   → Redirected to:', url);
                    }
                }
            }

            
            return await originalFetch.call(this, url, options);

        } catch (error) {
            
            return await originalFetch.apply(this, args);
        }
    };

    console.log('✅ Fetch interceptor installed - will handle extension verification based on login status');
})();