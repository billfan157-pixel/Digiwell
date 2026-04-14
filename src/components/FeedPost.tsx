import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

export interface PostData {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  timeAgo: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export const PostSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 p-4 md:p-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      
      {/* Body Skeleton */}
      <div className="space-y-2 mt-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-[90%]"></div>
        <div className="h-4 bg-gray-200 rounded w-[60%]"></div>
      </div>
      
      {/* Image Skeleton */}
      <div className="mt-4 h-56 bg-gray-200 rounded-xl w-full"></div>
      
      {/* Action Bar Skeleton */}
      <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between px-2">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
};

interface FeedPostProps {
  post: PostData;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const FeedPost = ({ post, onLike, onComment, onShare }: FeedPostProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0 object-cover overflow-hidden">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
            ) : (
              post.author.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-900 font-semibold text-base truncate">{post.author.name}</h3>
            <p className="text-gray-500 text-sm">{post.timeAgo}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="mt-2">
        {post.content && (
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto max-h-96 object-cover rounded-xl mt-3" />
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between px-1">
        <button onClick={onLike} className={`flex items-center gap-2 group transition-colors duration-200 ${post.isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}>
          <Heart size={20} className={`transition-transform duration-200 group-active:scale-90 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="font-medium text-sm">{post.likes > 0 ? post.likes : 'Thích'}</span>
        </button>
        <button onClick={onComment} className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group">
          <MessageCircle size={20} className="transition-transform group-active:scale-90" />
          <span className="font-medium text-sm">{post.comments > 0 ? post.comments : 'Bình luận'}</span>
        </button>
        <button onClick={onShare} className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 transition-colors group">
          <Share2 size={20} className="transition-transform group-active:scale-90" />
          <span className="font-medium text-sm">Chia sẻ</span>
        </button>
      </div>
    </div>
  );
};