import { X } from "lucide-react";
import { useState } from "react";

const TwitterMetricFilterForm = ({ isOpen, onClose, onSubmit, formType }) => {
  const [formData, setFormData] = useState({
    // Metrics
    followers: '',
    following: '',
    tweets: '',
    impressions: '',
    engagement: '',
    retweets: '',
    
    // Filters
    accountType: '',
    niche: '',
    location: '',
    language: '',
    verified: '',
    accountAge: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const renderMetricsForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Twitter Account Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Followers</label>
          <input
            type="number"
            name="followers"
            value={formData.followers}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter follower count"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Following</label>
          <input
            type="number"
            name="following"
            value={formData.following}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter following count"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Total Tweets</label>
          <input
            type="number"
            name="tweets"
            value={formData.tweets}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter tweet count"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Impressions</label>
          <input
            type="number"
            name="impressions"
            value={formData.impressions}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter impressions"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Engagement Rate (%)</label>
          <input
            type="number"
            name="engagement"
            value={formData.engagement}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter engagement rate"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Average Retweets</label>
          <input
            type="number"
            name="retweets"
            value={formData.retweets}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter average retweets"
          />
        </div>
      </div>
    </div>
  );

  const renderFiltersForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Twitter Account Filters</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
          >
            <option value="">Select account type</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
            <option value="influencer">Influencer</option>
            <option value="brand">Brand</option>
            <option value="news">News/Media</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Niche</label>
          <select
            name="niche"
            value={formData.niche}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
          >
            <option value="">Select niche</option>
            <option value="tech">Technology</option>
            <option value="crypto">Cryptocurrency</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
            <option value="finance">Finance</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
            placeholder="Enter location"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Primary Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
          >
            <option value="">Select language</option>
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="french">French</option>
            <option value="german">German</option>
            <option value="japanese">Japanese</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Verification Status</label>
          <select
            name="verified"
            value={formData.verified}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
          >
            <option value="">Select status</option>
            <option value="verified">Verified</option>
            <option value="not-verified">Not Verified</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Account Age</label>
          <select
            name="accountAge"
            value={formData.accountAge}
            onChange={handleInputChange}
            className="w-full p-3 bg-[rgba(255,255,255,0.1)] rounded-lg text-white border border-gray-600 focus:border-[#613cd0] focus:outline-none"
          >
            <option value="">Select age</option>
            <option value="0-1">0-1 year</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[20000] rounded-md flex items-center justify-center overflow-y-auto">
      <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-4xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {formType === 'metrics' ? 'Account Metrics' : 'Account Filters'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {formType === 'metrics' ? renderMetricsForm() : renderFiltersForm()}
          
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#613cd0] text-white rounded-lg hover:bg-[#7050d5] transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwitterMetricFilterForm;