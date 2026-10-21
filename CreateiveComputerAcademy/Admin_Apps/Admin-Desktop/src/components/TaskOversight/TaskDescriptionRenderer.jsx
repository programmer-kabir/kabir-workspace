import { FiCode } from 'react-icons/fi';
const isColorHex = (str) => typeof str === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(str);


const DynamicJsonViewer = ({ data, level = 0 }) => {
    if (data === null) return <span className="text-slate-400 dark:text-slate-500 italic text-sm">null</span>;
    if (typeof data === 'boolean') return <span className={`text-sm ${data ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}`}>{data ? 'True' : 'False'}</span>;
    if (typeof data === 'number') return <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{data}</span>;
    if (typeof data === 'string') {
        if (isColorHex(data)) {
            return (
                <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full shadow-sm inline-block shrink-0" style={{ backgroundColor: data }}></span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{data}</span>
                </span>
            );
        }
        return <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{data}</span>;
    }
    if (Array.isArray(data)) {
        return (
            <ul className="flex flex-col gap-1.5 mt-1 list-disc list-inside text-slate-400 dark:text-slate-500 marker:text-slate-300 dark:marker:text-slate-600 pl-1">
                {data.map((item, idx) => (
                    <li key={idx} className="text-sm">
                        <span className="inline-block align-top ml-[-4px] w-[calc(100%-12px)]">
                            <DynamicJsonViewer data={item} level={level + 1} />
                        </span>
                    </li>
                ))}
            </ul>
        );
    }
    if (typeof data === 'object') {
        return (
            <div className={`flex flex-col gap-2.5 ${level > 0 ? 'mt-1.5 pl-3 border-l-2 border-slate-100 dark:border-slate-700' : ''}`}>
                {Object.entries(data).map(([key, val]) => {
                    const isComplex = typeof val === 'object' && val !== null;
                    return (
                        <div key={key} className={`flex ${isComplex ? 'flex-col' : 'items-start gap-3'}`}>
                            <span className={`text-xs font-bold capitalize shrink-0 ${!isComplex ? 'w-1/3 min-w-[120px] max-w-[150px] pt-0.5 text-slate-500 dark:text-slate-400' : 'mb-0.5 text-slate-800 dark:text-slate-200'}`}>
                                {key.replace(/_/g, ' ')}
                            </span>
                            <div className={`${isComplex ? 'w-full' : 'flex-1 break-words'}`}>
                                <DynamicJsonViewer data={val} level={level + 1} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

export const extractJsonFromHtml = (htmlContent) => {
    let jsonData = null;
    let remainingHtml = htmlContent;
    let hasRemainingText = true;

    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        let rawText = tempDiv.textContent || '';

        // Replace non-breaking spaces for JSON parsing, keeping length identical
        let cleanText = rawText.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ');

        const startBrace = cleanText.indexOf('{');
        const startBracket = cleanText.indexOf('[');

        let startIndex = -1;
        let openChar, closeChar;

        if (startBrace !== -1 && startBracket !== -1) {
            if (startBrace < startBracket) { startIndex = startBrace; openChar = '{'; closeChar = '}'; }
            else { startIndex = startBracket; openChar = '['; closeChar = ']'; }
        } else if (startBrace !== -1) {
            startIndex = startBrace; openChar = '{'; closeChar = '}';
        } else if (startBracket !== -1) {
            startIndex = startBracket; openChar = '['; closeChar = ']';
        }

        if (startIndex !== -1) {
            let count = 0;
            let inString = false;
            let escape = false;
            let endIndex = -1;

            for (let i = startIndex; i < cleanText.length; i++) {
                const char = cleanText[i];
                if (escape) { escape = false; continue; }
                if (char === '\\') { escape = true; continue; }
                if (char === '"') { inString = !inString; continue; }

                if (!inString) {
                    if (char === openChar) count++;
                    else if (char === closeChar) {
                        count--;
                        if (count === 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                }
            }

            if (endIndex !== -1) {
                const potentialJson = cleanText.substring(startIndex, endIndex);
                try {
                    jsonData = JSON.parse(potentialJson);

                    let charIndex = 0;
                    const removeJsonText = (node) => {
                        if (node.nodeType === 3) {
                            const nodeText = node.textContent;
                            const nodeLen = nodeText.length;
                            const nodeStart = charIndex;
                            const nodeEnd = charIndex + nodeLen;

                            const overlapStart = Math.max(nodeStart, startIndex);
                            const overlapEnd = Math.min(nodeEnd, endIndex);

                            if (overlapStart < overlapEnd) {
                                const localStart = overlapStart - nodeStart;
                                const localEnd = overlapEnd - nodeStart;
                                node.textContent = nodeText.substring(0, localStart) + nodeText.substring(localEnd);
                            }
                            charIndex += nodeLen;
                        } else {
                            const children = Array.from(node.childNodes);
                            for (let child of children) {
                                removeJsonText(child);
                            }
                        }
                    };

                    removeJsonText(tempDiv);

                    let cleanedHtml = tempDiv.innerHTML;
                    // Recursively remove empty block tags left behind
                    let prev;
                    do {
                        prev = cleanedHtml;
                        cleanedHtml = cleanedHtml.replace(/<(p|div|span|h[1-6]|ul|ol|li)[^>]*>\s*<\/\1>/gi, '');
                    } while (cleanedHtml !== prev);

                    // Collapse excessive line breaks
                    cleanedHtml = cleanedHtml.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');
                    cleanedHtml = cleanedHtml.replace(/(<p[^>]*>\s*(<br\s*\/?>|&nbsp;)?\s*<\/p>\s*){3,}/gi, '<p><br></p><p><br></p>');

                    remainingHtml = cleanedHtml;

                    const checkDiv = document.createElement('div');
                    checkDiv.innerHTML = remainingHtml;
                    hasRemainingText = checkDiv.textContent.trim().length > 0 || checkDiv.querySelector('img, video, iframe') !== null;
                } catch (e) {
                    // JSON parse failed, ignore
                }
            }
        }
    } catch (e) {
        jsonData = null;
        remainingHtml = htmlContent;
    }

    return { jsonData, remainingHtml, hasRemainingText };
};

// Strip hardcoded light inline font colors so rich text is crystal clear in both light and dark mode
const sanitizeInlineColors = (html) => {
    if (!html) return html;
    return html
        .replace(/color:\s*(#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*[0-9.]+\s*\)|#f8fafc|#f1f5f9|#e2e8f0|#cbd5e1|#94a3b8)/gi, 'color: inherit')
        .replace(/background-color:\s*(#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|#000|#000000|black)/gi, 'background-color: transparent');
};

export const DescriptionRenderer = ({ htmlContent }) => {
    const { jsonData, remainingHtml, hasRemainingText } = extractJsonFromHtml(htmlContent);
    const sanitizedHtml = sanitizeInlineColors(remainingHtml);

    return (
        <div className="space-y-4">
            {jsonData && (
                <div className="bg-slate-50/70 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <FiCode size={16} className="text-blue-500" />
                            Structured JSON Data
                        </h4>
                    </div>
                    <DynamicJsonViewer data={jsonData} />
                </div>
            )}
            {(!jsonData || hasRemainingText) && (
                <div
                    className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-2xl text-slate-800 dark:text-slate-200 text-sm border border-slate-200/80 dark:border-slate-700 prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:my-2 prose-headings:mb-3 prose-headings:mt-4 prose-ul:my-2 prose-li:my-0 leading-normal task-description-content"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml || '<p class="italic text-slate-400">No description provided.</p>' }}
                />
            )}
        </div>
    );
};
