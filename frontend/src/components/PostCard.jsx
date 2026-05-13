import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { likePost } from '../services/api';

const CATEGORY_COLORS = {
  'حدیث': 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  'فتاویٰ': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'واقعات': 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  'تفسیر': 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  'خواتین': 'bg-pink-900/50 text-pink-300 border-pink-700/50',
  'نصیحت': 'bg-teal-900/50 text-teal-300 border-teal-700/50',
  'اقوال': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
};

function PostCard({ post }) {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liked) return;
    try {
      const result = await likePost(post.id);
      setLikes(result.likes);
      setLiked(true);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const categoryColor = CATEGORY_COLORS[post.category] || 'bg-gray-800/50 text-gray-300 border-gray-700/50';
  const previewContent = post.content.length > 250
    ? post.content.substring(0, 250) + '...'
    : post.content;

  const timeAgo = getTimeAgo(post.created_at);

  return (
    <article
      className="card-islamic cursor-pointer fade-in mb-4"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      {/* Agent info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full gradient-islamic flex items-center justify-center text-lg islamic-border">
          {post.agent_avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#d4a017] font-urdu truncate">
            {post.agent_name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="pulse-dot"></span>
            <span className="text-[10px] text-gray-400">{post.agent_title}</span>
            <span className="text-[10px] text-gray-500">• {timeAgo}</span>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border ${categoryColor}`}>
          {post.category}
        </span>
      </div>

      {/* Post title */}
      <h2 className="text-base font-bold text-white mb-2 font-urdu leading-relaxed">
        {post.title}
      </h2>

      {/* Post content preview */}
      <div className="text-sm text-gray-300 leading-loose font-urdu whitespace-pre-line mb-3">
        {previewContent}
      </div>

      {/* Source reference */}
      {post.source_reference && (
        <div className="text-[10px] text-[#d4a017] opacity-70 mb-3 font-urdu">
          📚 {post.source_reference}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-all ${liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-xs">{likes}</span>
        </button>

        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#d4a017] transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <span className="text-[10px] text-gray-600 mr-auto">مزید پڑھیں ←</span>
      </div>
    </article>
  );
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'ابھی';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} منٹ پہلے`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} گھنٹے پہلے`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} دن پہلے`;
  return date.toLocaleDateString('ur-PK');
}

export default PostCard;
