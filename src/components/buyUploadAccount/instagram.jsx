// instagram.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";

export const InstagramMetricForm = ({ isOpen, onClose, onSubmit }) => {
  const [accountType, setAccountType] = useState('business'); 
  const [formData, setFormData] = useState({
    followerDemographics: '',
    engagementRate: '',
    monetised: '',
    // Business with FB additional fields
    mediaInsights: '',
    storyViews: '',
    reelsPerformance: ''
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
    const requiredFields = accountType === 'business_with_fb'
      ? Object.values(formData).filter(value => value.toString().trim() !== '').length
      : [formData.followerDemographics, formData.engagementRate, formData.monetised].filter(v => v.toString().trim() !== '').length;

    const totalFields = accountType === 'business_with_fb' ? 6 : 3; // removed price
    const score = Math.min((requiredFields / totalFields) * 100, 100);

    // Transform data to match API format for requirements
    const metrics = [];
    
    // Add preferred follower demographics
    if (formData.followerDemographics) {
      metrics.push({
        key: "preferred_top_country",
        value: formData.followerDemographics,
        type: "string"
      });
    }
    
    // Add min engagement rate
    if (formData.engagementRate) {
      metrics.push({
        key: "min_engagement_rate",
        value: parseFloat(formData.engagementRate),
        type: "number"
      });
    }
    
    // Add requires monetised
    if (formData.monetised) {
      metrics.push({
        key: "requires_monetised",
        value: formData.monetised === 'yes',
        type: "boolean"
      });
    }
    
    // Add required account type
    metrics.push({
      key: "required_account_type",
      value: accountType,
      type: "string"
    });
    
    // Add additional fields for Business with FB Page
    if (accountType === 'business_with_fb') {
      if (formData.mediaInsights) {
        metrics.push({
          key: "min_average_post_reach",
          value: parseFloat(formData.mediaInsights),
          type: "number"
        });
      }
      
      if (formData.storyViews) {
        metrics.push({
          key: "min_average_story_views",
          value: parseFloat(formData.storyViews),
          type: "number"
        });
      }
      
      if (formData.reelsPerformance) {
        metrics.push({
          key: "min_average_reels_views",
          value: parseFloat(formData.reelsPerformance),
          type: "number"
        });
      }
    }

    
    onSubmit(score, 'metrics', metrics);
  } catch (err) {
    setError(err.message || 'Failed to submit requirements');
    console.error('❌ Error submitting Instagram requirements:', err);
  } finally {
    setLoading(false);
  }
};


  const isFormValid = () => {
    if (accountType === 'business') {
      return formData.followerDemographics.trim() !== '' && 
             formData.engagementRate.trim() !== '' && 
             formData.monetised !== '';
    } else {
      return formData.followerDemographics.trim() !== '' && 
             formData.engagementRate.trim() !== '' && 
             formData.monetised !== '' && 
             formData.mediaInsights.trim() !== '' &&
             formData.storyViews.trim() !== '' &&
             formData.reelsPerformance.trim() !== '';
    }
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
          {/* Account Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Required Account Type <span className="text-red-500">*</span>
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
            >
              <option value="business">Business</option>
              <option value="business_with_fb">Business with FB Page</option>
            </select>
          </div>

          {/* Follower Demographics */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Preferred Follower Demographics <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Preferred Top Country
            </label>
            <select
              name="followerDemographics"
              value={formData.followerDemographics}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
            >
              <option value="">Select Preferred Top Country</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="India">India</option>
              {/* Add more */}
            </select>
          </div>

          {/* Engagement Rate */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Engagement Rate <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Engagement Rate (%)
            </label>
            <input
              type="number"
              name="engagementRate"
              value={formData.engagementRate}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Engagement Rate"
            />
          </div>

          {/* Monetised */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Requires Monetised <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Require Account to be Monetised?
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

          {accountType === 'business_with_fb' && (
            <>
              {/* Media Insights */}
              <div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <img src={star} alt="" />
                  <h2>Minimum Media Insights <span className="text-primary"> *</span></h2>
                </div>
                <label className="block text-sm font-normal text-[#868686] mb-2">
                  Minimum Average Post Reach
                </label>
                <input
                  type="number"
                  name="mediaInsights"
                  value={formData.mediaInsights}
                  onChange={handleInputChange}
                  className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  placeholder="Enter Minimum Average Post Reach"
                />
              </div>

              {/* Story Views */}
              <div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <img src={star} alt="" />
                  <h2>Minimum Story Views <span className="text-primary"> *</span></h2>
                </div>
                <label className="block text-sm font-normal text-[#868686] mb-2">
                  Minimum Average Story Views
                </label>
                <input
                  type="number"
                  name="storyViews"
                  value={formData.storyViews}
                  onChange={handleInputChange}
                  className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  placeholder="Enter Minimum Average Story Views"
                />
              </div>

              {/* Reels Performance */}
              <div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <img src={star} alt="" />
                  <h2>Minimum Reels Performance <span className="text-primary"> *</span></h2>
                </div>
                <label className="block text-sm font-normal text-[#868686] mb-2">
                  Minimum Average Reels Views
                </label>
                <input
                  type="number"
                  name="reelsPerformance"
                  value={formData.reelsPerformance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  placeholder="Enter Minimum Average Reels Views"
                />
              </div>
            </>
          )}

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

export const InstagramFilterForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    followers: '',
    originalEmail: '',
    dateCreated: '',
    niche: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const niches = [
    "Art & Design", "Automotive", "Beauty", "Books & Literature", "Business & Finance", 
    "Education", "Entertainment", "Events & Holidays", "Family & Parenting", "Fashion", 
    "Food & Drink", "Gaming", "Health & Fitness", "Hobbies & Interests", "Home & Garden", 
    "Lifestyle", "Men's Fashion", "Movies & TV", "Music", "News & Politics", 
    "Pets", "Photography", "Science", "Shopping", "Sports", 
    "Technology & Computing", "Travel", "Women's Fashion"
  ];

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
      const score = filledFields * 20;

      const filters = [
        { key: "preferred_username", value: formData.username, type: "string" },
        { key: "min_followers", value: parseInt(formData.followers), type: "number" },
        { key: "requires_original_email", value: formData.originalEmail === 'yes', type: "boolean" },
        { key: "preferred_niche", value: formData.niche, type: "string" },
        { key: "min_date_created", value: formData.dateCreated, type: "string" } // assuming date as string
      ];

      
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting Instagram filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.followers.trim() !== '' && 
           formData.originalEmail !== '' && 
           formData.niche !== '' && 
           formData.dateCreated !== '';
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

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preferred Username */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Preferred Username</h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Preferred Account Username (optional)
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Preferred Account Username"
            />
          </div>

          {/* Minimum Follower Count */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Follower Count <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Followers
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

          {/* Requires Original Email */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Requires Original Email <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Require Email Availability 
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

          {/* Minimum Age */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Age <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Date Created
            </label>
            <input
              type="month"
              name="dateCreated"
              value={formData.dateCreated}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0] [color-scheme:dark]"
            />
          </div>

          {/* Preferred Content Niche */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Preferred Content Niche <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Preferred Niche
            </label>
            <select
              name="niche"
              value={formData.niche}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
            >
              <option value="">Select Preferred Niche</option>
              {niches.map(niche => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
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