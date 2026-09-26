import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  Eye,
  RemoveFormatting
} from "lucide-react";

const RichTextEditor = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState("visual"); // 'visual' | 'code'
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && activeTab === "visual") {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, activeTab]);

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#12121E] shadow-2xl">
      {/* Editor Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3.5 border-b border-white/10 text-gray-300">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Underline"
          >
            <Underline size={16} />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h1>")}
            className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors font-extrabold text-xs"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors font-bold text-xs"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors font-semibold text-xs"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<p>")}
            className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs"
            title="Paragraph"
          >
            P
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<blockquote>")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Quote"
          >
            <Quote size={16} />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={addLink}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Insert Link"
          >
            <LinkIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Clear Formatting"
          >
            <RemoveFormatting size={16} />
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "visual"
                ? "bg-[#6C4FE0] text-white shadow-md font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Eye size={13} />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "code"
                ? "bg-[#6C4FE0] text-white shadow-md font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Code size={13} />
            HTML Source
          </button>
        </div>
      </div>

      {/* Editor Content Body */}
      {activeTab === "visual" ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-6 min-h-[400px] text-gray-200 outline-none focus:ring-0 leading-relaxed font-sans"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[400px] p-6 font-mono text-xs text-emerald-400 bg-[#0c0c14] border-none outline-none resize-y"
          placeholder="<h1>Page Title</h1><p>Write raw HTML content...</p>"
        />
      )}
    </div>
  );
};

export default RichTextEditor;
