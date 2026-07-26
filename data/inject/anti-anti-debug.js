!(() => {
    const Proxy = window.Proxy;
    const Object = window.Object;
    const Array = window.Array;
    
    const Originals = {
        createElement: document.createElement,
        log: console.log,
        table: console.table,
        clear: console.clear,
        functionConstructor: window.Function.prototype.constructor,
        setInterval: window.setInterval,
        createElement: document.createElement,
        toString: Function.prototype.toString,
        addEventListener: window.addEventListener
    }

    
    const cutoffs = {
        table: {
            amount: 5,
            within: 5000
        },
        clear: {
            amount: 5,
            within: 5000
        },
        redactedLog: {
            amount: 5,
            within: 5000
        },
        debugger: {
            amount: 10,
            within: 10000
        },
        debuggerThrow: {
            amount: 10,
            within: 10000
        }
    }

    
    function shouldLog(type) {

            return false;
    }

    window.console.log = wrapFn((...args) => {
        
        let redactedCount = 0;

        
        const newArgs = args.map((a) => {

            
            if (typeof a === 'function') {
                redactedCount++;
                return "Redacted Function";
            }

            
            if (typeof a !== 'object' || a === null) return a;

            
            var props = Object.getOwnPropertyDescriptors(a)
            for (var name in props) {

                
                if (props[name].get !== undefined) {
                    redactedCount++;
                    return "Redacted Getter";
                }

                
                if (name === 'toString') {
                    redactedCount++;
                    return "Redacted Str";
                }
            }

            
            
            if (Array.isArray(a) && a.length === 50 && typeof a[0] === "object") {
                redactedCount++;
                return "Redacted LargeObjArray";
            }

            return a;
        });

        
        if (redactedCount >= Math.max(args.length - 1, 1)) {
            if (!shouldLog("redactedLog")) {
                return;
            }
        }

    }, Originals.log);

    window.console.table = wrapFn((obj) => {
        if (shouldLog("table")) {
        }
    }, Originals.table);

    window.console.clear = wrapFn(() => {
        if (shouldLog("table")) {
        }
    }, Originals.clear);

    let debugCount = 0;
    window.Function.prototype.constructor = wrapFn((...args) => {
        const originalFn = Originals.functionConstructor.apply(this, args);
        var fnContent = args[0];
        if (fnContent) {
            if (fnContent.includes('debugger')) { 
                if (shouldLog("debugger")) {
                }
                debugCount++;
                if (debugCount > 100) {
                    if (shouldLog("debuggerThrow")) {
                    }
                    throw new Error("You bad!");
                } else {
                    setTimeout(() => {
                        debugCount--;
                    }, 1);
                }
                const newArgs = args.slice(0);
                newArgs[0] = args[0].replaceAll("debugger", ""); // remove debugger statements
                return new Proxy(Originals.functionConstructor.apply(this, newArgs),{
                    get: function (target, prop) {
                        if (prop === "toString") {
                            return originalFn.toString;
                        }
                        return target[prop];
                    }
                });
            }
        }
        return originalFn;
    }, Originals.functionConstructor);

    document.createElement = wrapFn((el, o) => {
        var string = el.toString();
        var element = Originals.createElement.apply(document, [string, o]);
        if (string.toLowerCase() === "iframe") {
            element.addEventListener("load", () => {
                try {
                    element.contentWindow.window.console = window.console;
                } catch (e) {

                }
            });
        }
        return element;
    }, Originals.createElement);

    function wrapFn(newFn, old) {
        return new Proxy(newFn, {
            get: function (target, prop) {
                const callMethods = ['apply', 'bind', 'call'];
                if (callMethods.includes(prop)) {
                    return target[prop];
                }
                return old[prop];
            }
        });
    }
})()
