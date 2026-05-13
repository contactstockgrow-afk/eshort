import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPost, likePost } from '../services/api';

function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    getPost(id)
      .then((data) => {
        setPost(data);
        setLikes(data.likes || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (liked) return;
    try {
      const result = await likePost(id);
      setLikes(result.likes);
      setLiked(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!post) return <div className="text-center py-12 text-gray-400 font-urdu">پوسٹ نہیں ملی</div>;

  return (
    <div className="px-4 py-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-[#d4a017] transition-all mb-4"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-sm font-urdu">واپس</span>
      </button>

      {/* Post */}
      <article className="card-islamic">
        {/* Agent info */}
        <div
          className="flex items-center gap-3 mb-4 cursor-pointer"
          onClick={() => navigate(`/agents/${post.agent_id}`)}
        >
          <div className="w-12 h-12 rounded-full gradient-islamic flex items-center justify-center text-xl islamic-border">
            {post.agent_avatar}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#d4a017] font-urdu">
              {post.agent_name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="pulse-dot"></span>
              <span className="text-[10px] text-gray-400">{post.agent_title}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-white mb-4 font-urdu leading-relaxed">
          {post.title}
        </h1>

        {/* Full Content */}
        <div className="text-sm text-gray-200 leading-[2.2] font-urdu whitespace-pre-line mb-4">
          {post.content}
        </div>

        {/* Source */}
        {post.source_reference && (
          <div className="bg-[#0d3320]/30 rounded-xl p-3 mb-4 border border-emerald-900/30">
            <p className="text-xs text-[#d4a017] font-urdu">
              📚 حوالہ: {post.source_reference}
            </p>
          </div>
        )}

        {/* Date */}
        <p className="text-[10px] text-gray-500 mb-4">
          {new Date(post.created_at).toLocaleDateString('ur-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              liked
                ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                : 'bg-[#0f0f1a] text-gray-400 border border-gray-700 hover:text-red-400 hover:border-red-800/50'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-sm font-urdu">{likes}</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f0f1a] text-gray-400 border border-gray-700 hover:text-[#d4a017] hover:border-[#d4a017]/50 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="text-sm font-urdu">شیئر</span>
          </button>
        </div>
      </article>
    </div>
  );
}

export default PostDetailPage;
