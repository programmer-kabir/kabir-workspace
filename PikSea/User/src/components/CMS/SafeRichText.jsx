import React from 'react';
import DOMPurify from 'dompurify';

const SafeRichText = ({ content, className = '' }) => {
    if (!content) return null;

    // Configure DOMPurify to allow standard rich text tags but prevent scripts
    const sanitizedHTML = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'section'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'rel'],
    });

    return (
        <div 
            className={`
                text-gray-800 dark:text-gray-300 text-[17px] leading-relaxed
                [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-gray-900 dark:[&_h1]:text-white [&_h1]:mb-6 [&_h1]:mt-8
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mb-4 [&_h2]:mt-10
                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_h3]:mb-3 [&_h3]:mt-8
                [&_p]:mb-5
                [&_a]:text-[#007b99] dark:[&_a]:text-[#00D4FF] hover:[&_a]:text-[#0092b3] dark:hover:[&_a]:text-[#00b3cc] [&_a]:underline
                [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6
                [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6
                [&_li]:mb-2
                [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_strong]:font-semibold
                ${className}
            `}
            dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
    );
};

export default SafeRichText;
