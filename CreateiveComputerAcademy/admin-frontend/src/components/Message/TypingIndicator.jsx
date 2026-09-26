const TypingIndicator = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center text-3xl shadow-inner mb-4">
                💬
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">CCA Chat Terminal</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-[280px] leading-relaxed font-semibold">
                Select a conversation from the left sidebar to read, write, or share documents. Click the "+" button to start a new chat.
            </p>
        </div>
    )
}

export default TypingIndicator;