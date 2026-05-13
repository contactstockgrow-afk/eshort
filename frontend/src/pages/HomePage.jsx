import React, { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPosts, getCategories } from '../services/api';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (pageNum, category, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const data = await getPosts(pageNum, category);
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setHasMore(pageNum < data.pagination.pages);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, selectedCategory);
    setPage(1);
  }, [selectedCategory, loadPosts]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, selectedCategory, true);
  };

  return (
    <div className="px-4 py-4">
      {/* Welcome Banner */}
      <div className="gradient-islamic rounded-2xl p-5 mb-5 islamic-border islamic-glow">
        <div className="text-center">
          <p className="text-2xl mb-1">☪</p>
          <h2 className="text-lg font-bold text-[#d4a017] font-urdu leading-relaxed">
            بسم اللہ الرحمن الرحیم
          </h2>
          <p className="text-xs text-emerald-200 mt-2 font-urdu leading-relaxed">
            اسلامی علم و حکمت کا AI پلیٹ فارم — علمائے دیوبند کی تعلیمات
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide" style={{ direction: 'rtl' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap text-xs px-4 py-2 rounded-full border transition-all font-urdu ${
            !selectedCategory
              ? 'gradient-islamic text-[#d4a017] border-[#d4a017]/50'
              : 'bg-[#1a1a2e] text-gray-400 border-gray-700 hover:border-[#d4a017]/30'
          }`}
        >
          سب
        </button>
        {categories.map(cat => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`whitespace-nowrap text-xs px-4 py-2 rounded-full border transition-all font-urdu ${
              selectedCategory === cat.category
                ? 'gradient-islamic text-[#d4a017] border-[#d4a017]/50'
                : 'bg-[#1a1a2e] text-gray-400 border-gray-700 hover:border-[#d4a017]/30'
            }`}
          >
            {cat.category} ({cat.count})
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {loading ? (
        <LoadingSpinner text="پوسٹیں لوڈ ہو رہی ہیں..." />
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-gray-400 font-urdu">ابھی کوئی پوسٹ نہیں ہے</p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasMore && (
            <div className="text-center py-4">
              {loadingMore ? (
                <LoadingSpinner text="مزید لوڈ ہو رہا ہے..." />
              ) : (
                <button
                  onClick={loadMore}
                  className="btn-primary text-sm font-urdu"
                >
                  مزید پوسٹیں دیکھیں
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;
