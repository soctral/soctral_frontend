// tiktok.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";
import { useStableFormState } from "../../hooks/useStableFormState";

export const TiktokMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  // 🔥 FIX: Use stable form state hook to prevent data loss on re-renders
  const defaultState = {
    likes: '',
    engagements: '',
    numberOfPosts: ''
  };

  const { formData, handleInputChange, resetForm } = useStableFormState(defaultState, existingData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Memoized submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate score based on filled fields
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = Math.round((filledFields / 3) * 100);

      // Prepare metrics array in the API format
      const metrics = [
        { key: "likes", value: parseInt(formData.likes) || 0, type: "number" },
        { key: "engagements", value: parseInt(formData.engagements) || 0, type: "number" },
        { key: "number_of_posts", value: parseInt(formData.numberOfPosts) || 0, type: "number" }
      ];


      // Pass metrics back to parent with score
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to submit metrics');
      console.error('❌ Error submitting TikTok metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit]);

  const isFormValid = () => {
    return formData.likes.trim() !== '' &&
      formData.engagements.trim() !== '' &&
      formData.numberOfPosts.trim() !== '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10001] rounded-md flex items-center justify-center overflow-y-auto">
      <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center mb-[.8rem]">
          <h3 className="text-md font-semibold mb-5">Account Metrics</h3>
          <p className="text-xs font-normal text-[#868686]">
            Metrics marked with (*) are mandatory and must be provided. Ensure all required details are accurate to successfully upload your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Videos */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Videos <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Videos
            </label>
            <input
              type="number"
              name="videos"
              value={formData.videos}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Videos"
            />
          </div>

          {/* Total Likes */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Total Likes <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Lifetime Likes
            </label>
            <input
              type="number"
              name="totalLikes"
              value={formData.totalLikes}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Total Likes"
            />
          </div>

          {/* Monetised Account */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Monetised Account <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Is this account monetised?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="monetised"
                  value="yes"
                  checked={formData.monetised === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="monetised"
                  value="no"
                  checked={formData.monetised === 'no'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Average Engagement */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Average Engagement <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Average Engagement Rate (%)
            </label>
            <input
              type="number"
              name="averageEngagement"
              value={formData.averageEngagement}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Average Engagement Rate (%)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${isFormValid() && !loading
                  ? 'bg-[#613cd0] hover:bg-[#7050d5]'
                  : 'bg-gray-500 cursor-not-allowed'
                }`}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TiktokFilterForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  // 🔥 FIX: Use stable form state hook to prevent data loss on re-renders
  const defaultState = {
    username: '',
    followersCount: '',
    originalEmail: '',
    niche: '',
    age: ''
  };

  const { formData, handleInputChange, resetForm } = useStableFormState(defaultState, existingData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const niches = [
    'Business & Finance',
    'Technology',
    'Entertainment',
    'Sports',
    'News & Media',
    'Gaming',
    'Education',
    'Health & Wellness',
    'Fashion & Beauty',
    'Food & Cooking',
    'Travel',
    'Art & Design',
    'Music',
    'Photography',
    'Lifestyle',
    'Parenting',
    'Politics',
    'Science',
    'Comedy',
    'Dance',
    'Other'
  ];

  // Memoized submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate score based on filled fields (20 points each = 100 total)
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = filledFields * 20;

      // Prepare filters array in the API format
      const filters = [
        { key: "username", value: formData.username, type: "string" },
        { key: "followers_count", value: parseInt(formData.followersCount) || 0, type: "number" },
        { key: "original_email", value: formData.originalEmail === 'yes', type: "boolean" },
        { key: "niche", value: formData.niche, type: "string" },
        { key: "account_age_years", value: parseFloat(formData.age) || 0, type: "number" }
      ];


      // Pass filters back to parent with score
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting TikTok filters:', err);
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit]);

  const isFormValid = () => {
    return formData.username.trim() !== '' &&
      formData.followersCount.trim() !== '' &&
      formData.originalEmail !== '' &&
      formData.niche !== '' &&
      formData.age.trim() !== '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10001] rounded-md flex items-center justify-center overflow-y-auto">
      <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-lg shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center mb-[.8rem]">
          <h3 className="text-md font-semibold mb-5">Account Filters</h3>
          <p className="text-xs font-normal text-[#868686]">
            Filters marked with (*) are mandatory and must be provided. Ensure all required details are accurate for better visibility and matching.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Username <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Account Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Account Username"
            />
          </div>

          {/* Followers Count */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Followers Count <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Followers
            </label>
            <input
              type="number"
              name="followersCount"
              value={formData.followersCount}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Followers"
            />
          </div>

          {/* Original Email */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Original Email <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Original Email Available?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="originalEmail"
                  value="yes"
                  checked={formData.originalEmail === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="originalEmail"
                  value="no"
                  checked={formData.originalEmail === 'no'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Niche */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Niche <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Content Niche
            </label>
            <select
              name="niche"
              value={formData.niche}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
            >
              <option value="">Select Niche</option>
              {niches.map(niche => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Age <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Account Age (Years)
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Account Age in Years"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${isFormValid() && !loading
                  ? 'bg-[#613cd0] hover:bg-[#7050d5]'
                  : 'bg-gray-500 cursor-not-allowed'
                }`}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};