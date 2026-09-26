import React from 'react';
import { FiMessageSquare, FiFile, FiCheck, FiMoreVertical, FiSmile, FiCornerUpLeft, FiShare2, FiEdit2, FiInfo, FiTrash2 } from 'react-icons/fi';

const MessageItem = ({
  msg,
  currentUser,
  activeChat,
  API_URL,
  emojis = [],
  handleReact,
  setReplyingTo,
  setEditingMessage,
  setTypedMessage,
  setForwardingMessage,
  setForwardModalOpen,
  setForwardSelectedTargets,
  setForwardSearchQuery,
  setInfoMessage,
  setMessageToDelete,
  setLightboxImage,
  activeDropdown,
  setActiveDropdown,
  showEmojiPickerId,
  setShowEmojiPickerId,
}) => {
  const isMe = msg.sender_id === currentUser?.id;
  const isImage = msg.file_path && msg.file_path.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  // Calculate receipt ticks
  let tickStatus = 0;
  if (isMe && msg.receipts) {
    const total = msg.receipts.length;
    if (total === 0) {
      tickStatus = 1;
    } else {
      const delivered = msg.receipts.filter((r) => r.delivered_at).length;
      const read = msg.receipts.filter((r) => r.read_at).length;
      if (read === total) tickStatus = 3;
      else if (delivered === total) tickStatus = 2;
      else tickStatus = 1;
    }
  }

  // System Message Block
  if (msg.message && msg.message.startsWith('__SYSTEM__:')) {
    const systemText = msg.message.replace('__SYSTEM__:', '');
    return (
      <div className="flex justify-center my-3 w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-200/70 dark:bg-slate-800/80 backdrop-blur-md border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-3.5 py-1 rounded-full shadow-xs text-center max-w-[85%]">
          {systemText}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      {/* Avatar (only for others) */}
      {!isMe && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden shadow-xs ring-1 ring-black/5 dark:ring-white/10 mt-1">
          {msg.sender_profile_picture ? (
            <img
              src={`${API_URL}${msg.sender_profile_picture}`}
              alt="Sender"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black uppercase">
              {msg.sender_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div className="flex flex-col relative group" onMouseLeave={() => setActiveDropdown(null)}>
        {/* Name for group chats */}
        {!isMe && activeChat?.type === 'group' && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1 ml-1">
            {msg.sender_name}
          </span>
        )}

        <div
          className={`relative p-3.5 rounded-2xl text-sm transition-all shadow-sm ${isMe
              ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-primary-600 text-white rounded-tr-xs shadow-indigo-500/15'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-slate-200/50 dark:shadow-none'
            } ${msg.reactions?.length > 0 ? 'mb-3.5' : ''}`}
        >
          {/* Forwarded Badge */}
          {msg.is_forwarded === 1 && !msg.is_deleted && (
            <div
              className={`flex items-center gap-1 text-[10px] font-extrabold italic mb-1.5 opacity-80 ${isMe ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                }`}
            >
              <FiMessageSquare size={11} className="rotate-180" /> Forwarded
            </div>
          )}

          {/* Top Quick Actions (Floating Capsule on Hover) */}
          {!msg.is_deleted && (
            <div
              className={`absolute top-1.5 ${isMe ? 'left-1.5' : 'right-1.5'
                } flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-lg p-0.5 z-10`}
            >
              {/* Emoji Reaction Trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPickerId(showEmojiPickerId === msg.id ? null : msg.id);
                  setActiveDropdown(null);
                }}
                className={`p-1 rounded-md transition-colors ${isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                title="React"
              >
                <FiSmile size={13} />
              </button>

              {/* Action Dropdown Trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === msg.id ? null : msg.id);
                }}
                className={`p-1 rounded-md transition-colors ${isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                title="Options"
              >
                <FiMoreVertical size={13} />
              </button>
            </div>
          )}

          {/* Dropdown Menu */}
          {activeDropdown === msg.id && !msg.is_deleted && (
            <div
              className={`absolute top-8 ${isMe ? 'left-0' : 'right-0'
                } w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyingTo(msg);
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <FiCornerUpLeft size={14} /> Reply
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setForwardingMessage(msg);
                  setForwardModalOpen(true);
                  setForwardSelectedTargets({ users: [], chats: [] });
                  setForwardSearchQuery('');
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
              >
                <FiShare2 size={14} /> Forward
              </button>
              {isMe && !msg.file_path && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMessage(msg);
                    setTypedMessage(msg.message);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors"
                >
                  <FiEdit2 size={14} /> Edit
                </button>
              )}
              {isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoMessage(msg);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <FiInfo size={14} /> Message Info
                </button>
              )}
              {isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMessageToDelete(msg.id);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border-t border-slate-100 dark:border-slate-700/60"
                >
                  <FiTrash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}

          {/* Replied Message Block */}
          {msg.reply_to_id && (
            <div
              className={`mb-2 p-2.5 rounded-xl text-xs border-l-4 ${isMe
                  ? 'bg-black/15 border-white/80 text-white/90'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-slate-700 dark:text-slate-200'
                }`}
            >
              <p className="font-extrabold mb-0.5 truncate text-[11px]">{msg.reply_to_name || 'User'}</p>
              <p className="truncate opacity-80 text-[11px]">{msg.reply_to_file ? '📎 Attachment' : msg.reply_to_message}</p>
            </div>
          )}

          {/* File Attachment */}
          {msg.file_path && (
            <div className="mb-2">
              {isImage ? (
                <img
                  src={`${API_URL}${msg.file_path}`}
                  alt="Attached"
                  onClick={() => setLightboxImage(msg.file_path)}
                  className="max-w-xs max-h-56 object-cover rounded-xl border border-slate-200/60 dark:border-slate-700/60 cursor-zoom-in hover:brightness-95 transition-all shadow-md"
                />
              ) : (
                <a
                  href={`${API_URL}${msg.file_path}`}
                  download={msg.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <FiFile className="text-lg" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold truncate max-w-[170px]">{msg.file_name}</p>
                    <p className="text-[10px] opacity-70">Click to download</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Message Text */}
          {msg.message && (
            <p className={`leading-relaxed whitespace-pre-wrap font-medium ${msg.is_deleted ? 'italic opacity-60 text-xs' : ''}`}>
              {msg.message}
              {msg.is_edited === 1 && !msg.is_deleted && (
                <span className="text-[9px] opacity-70 ml-1.5 italic inline-block">(edited)</span>
              )}
            </p>
          )}

          {/* Emoji Picker Popup */}
          {showEmojiPickerId === msg.id && !msg.is_deleted && (
            <div
              className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'
                } flex items-center gap-1 p-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-full shadow-2xl ring-1 ring-black/10 dark:ring-white/15 z-50 animate-in fade-in zoom-in-95 duration-150`}
            >
              {emojis?.map((emoji) => {
                const isSelected = msg.reactions?.some((r) => r.user_id === currentUser?.id && r.reaction === emoji);
                return (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(msg.id, emoji);
                    }}
                    className={`w-8 h-8 flex items-center justify-center text-lg rounded-full transition-all hover:scale-125 transform ${isSelected ? 'bg-indigo-100 dark:bg-indigo-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reaction Badges */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div
              className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'
                } flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200/80 dark:border-slate-700 text-[11px] animate-in zoom-in duration-150 z-10`}
            >
              {Array.from(new Set(msg.reactions.map((r) => r.reaction))).map((emoji) => (
                <span key={emoji} className="inline-block">
                  {emoji}
                </span>
              ))}
              <span className="text-slate-500 dark:text-slate-400 font-extrabold text-[10px] ml-0.5">
                {msg.reactions.length > 1 ? msg.reactions.length : ''}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp & Receipt Ticks */}
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-tight">
            {(() => {
              if (!msg.created_at) return '';
              let str = String(msg.created_at).trim().replace(' ', 'T');
              if (!str.includes('+') && !str.endsWith('Z')) str += '+06:00';
              return new Date(str).toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
            })()}
          </span>

          {/* Delivery Ticks */}
          {isMe && (
            <div className="flex items-center">
              {tickStatus === 1 && <FiCheck className="text-slate-400 dark:text-slate-500 text-xs" />}
              {tickStatus === 2 && (
                <div className="flex -space-x-1.5">
                  <FiCheck className="text-slate-400 dark:text-slate-500 text-xs" />
                  <FiCheck className="text-slate-400 dark:text-slate-500 text-xs" />
                </div>
              )}
              {tickStatus === 3 && (
                <div className="flex -space-x-1.5">
                  <FiCheck className="text-blue-500 text-xs" />
                  <FiCheck className="text-blue-500 text-xs" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
