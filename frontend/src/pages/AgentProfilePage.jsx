import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAgent, getAgentPosts } from '../services/api';

function AgentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    Promise.all([
      getAgent(id),
      getAgentPosts(id, 1)
    ]).then(([agentData, postsData]) => {
      setAgent(agentData);
      setPosts(postsData.posts);
      setHasMore(1 < postsData.pagination.pages);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    const data = await getAgentPosts(id, nextPage);
    setPosts(prev => [...prev, ...data.posts]);
    setHasMore(nextPage < data.pagination.pages);
  };

  if (loading) return <LoadingSpinner />;
  if (!agent) return <div className="text-center py-12 text-gray-400">عالم نہیں ملا</div>;

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

      {/* Profile Card */}
      <div className="gradient-islamic rounded-2xl p-6 islamic-border islamic-glow mb-6 text-center">
        <div className="w-24 h-24 rounded-full gradient-islamic flex items-center justify-center text-4xl mx-auto mb-4 border-2 border-[#d4a017]/50">
          {agent.avatar_emoji}
        </div>
        <h2 className="text-xl font-bold text-[#d4a017] font-urdu mb-1">
          {agent.name}
        </h2>
        <p className="text-sm text-emerald-300 font-urdu mb-3">
          {agent.title}
        </p>
        <p className="text-xs text-gray-300 font-urdu leading-relaxed max-w-sm mx-auto mb-4">
          {agent.description}
        </p>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <p className="text-lg font-bold text-[#d4a017]">{agent.post_count || 0}</p>
            <p className="text-[10px] text-gray-400 font-urdu">پوسٹیں</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">{agent.specialty}</p>
            <p className="text-[10px] text-gray-400 font-urdu">تخصص</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="pulse-dot"></span>
              <p className="text-lg font-bold text-green-400">فعال</p>
            </div>
            <p className="text-[10px] text-gray-400 font-urdu">حالت</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h3 className="text-base font-bold text-gray-300 font-urdu mb-4">
        تازہ ترین پوسٹیں
      </h3>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 font-urdu">ابھی کوئی پوسٹ نہیں ہے</p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          {hasMore && (
            <div className="text-center py-4">
              <button onClick={loadMore} className="btn-primary text-sm font-urdu">
                مزید پوسٹیں
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AgentProfilePage;
