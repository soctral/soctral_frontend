// wechat.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";

export const WechatMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    followers: '',
    likes: '',
    posts: '',
    engagement: '',
    pageViews: '',
    reach: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = Math.min((filledFields * 15), 100); // Each field adds 15 points, max 100

      const metrics = [
        { key: "min_followers", value: parseInt(formData.followers), type: "number" },
        { key: "min_likes", value: parseInt(formData.likes), type: "number" },
        { key: "min_posts", value: parseInt(formData.posts), type: "number" },
        { key: "min_engagement", value: parseFloat(formData.engagement), type: "number" },
        { key: "min_page_views", value: parseInt(formData.pageViews), type: "number" },
        { key: "min_reach", value: parseInt(formData.reach), type: "number" }
      ];

      
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to submit requirements');
      console.error('❌ Error submitting WeChat requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.followers.trim() !== '' && 
           formData.likes.trim() !== '' && 
           formData.posts.trim() !== '' && 
           formData.engagement.trim() !== '' && 
           formData.pageViews.trim() !== '' && 
           formData.reach.trim() !== '';
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
          <h3 className="text-md font-semibold mb-5">Account Requirements</h3>
          <p className="text-xs font-normal text-[#868686]">
            Requirements marked with (*) are mandatory and must be provided. Ensure all required details are accurate to successfully create your buy order.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Followers */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Followers <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Number of Followers
            </label>
            <input
              type="number"
              name="followers"
              value={formData.followers}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Number of Followers"
            />
          </div>

          {/* Likes */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Likes <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Number of Likes
            </label>
            <input
              type="number"
              name="likes"
              value={formData.likes}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Number of Likes"
            />
          </div>

          {/* Posts */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Posts <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Number of Posts
            </label>
            <input
              type="number"
              name="posts"
              value={formData.posts}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Number of Posts"
            />
          </div>

          {/* Engagement */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Engagement <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Engagement
            </label>
            <input
              type="number"
              name="engagement"
              value={formData.engagement}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Engagement"
            />
          </div>

          {/* Page Views */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Page Views <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Page Views
            </label>
            <input
              type="number"
              name="pageViews"
              value={formData.pageViews}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Page Views"
            />
          </div>

          {/* Reach */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Reach <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Reach
            </label>
            <input
              type="number"
              name="reach"
              value={formData.reach}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Reach"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${
                isFormValid() && !loading
                  ? 'bg-[#613cd0] hover:bg-[#7050d5]' 
                  : 'bg-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Submitting...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const WechatFilterForm = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFilters, setSelectedFilters] = useState([]);
  const filters = [
    'Verified', 'Business Account', 'High Engagement', 'Premium Content',
    'Active Community', 'Monetized', 'Original Owner', 'No Violations',
    'Custom Domain', 'SEO Optimized', 'Integrated Analytics', 'Ad Ready'
  ];

  const handleFilterToggle = (filter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const score = Math.min(selectedFilters.length * 20, 100);
    onSubmit(score, 'filters', selectedFilters.map(f => ({ key: f.toLowerCase().replace(/\s/g, '_'), value: true, type: "boolean" })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10002] rounded-md flex items-center justify-center overflow-y-auto">
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
          <h3 className="text-md font-semibold mb-5">Account Filters</h3>
          <p className="text-xs font-normal text-[#868686]">
            Filters marked with (*) are mandatory and must be provided. Ensure all required details are accurate to successfully create your buy order.
          </p>
        </div>

        <p className="text-[#868686] text-sm mb-4">
          Select at least 3 filters that describe your WeChat account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterToggle(filter)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilters.includes(filter)
                    ? 'bg-[#613cd0] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.2)]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedFilters.length < 3}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                selectedFilters.length >= 3
                  ? 'bg-[#613cd0] text-white hover:bg-[#7050d5]'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Submit Filters ({selectedFilters.length}/3+)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};