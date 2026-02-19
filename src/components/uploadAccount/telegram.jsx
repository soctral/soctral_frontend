// telegram.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";
import { useStableFormState } from "../../hooks/useStableFormState";

export const TelegramMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    messages: '',
    averageViews: '',
    monetised: '',
    engagementRate: ''
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
      // Calculate score based on filled fields (25 points each = 100 total)
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = filledFields * 25;

      // Prepare metrics array in the API format
      const metrics = [
        { key: "messages", value: parseInt(formData.messages), type: "number" },
        { key: "average_views", value: parseInt(formData.averageViews), type: "number" },
        { key: "is_monetised", value: formData.monetised === 'yes', type: "boolean" },
        { key: "engagement_rate", value: parseFloat(formData.engagementRate), type: "number" }
      ];

      
      // Pass metrics back to parent with score
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to submit metrics');
      console.error('❌ Error submitting Telegram metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.messages.trim() !== '' && 
           formData.averageViews.trim() !== '' && 
           formData.monetised !== '' && 
           formData.engagementRate.trim() !== '';
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
          {/* Messages */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Messages <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Messages/Posts
            </label>
            <input
              type="number"
              name="messages"
              value={formData.messages}
              onChange={handleChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Messages"
            />
          </div>

          {/* Average Views */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Average Views <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Average Post Views
            </label>
            <input
              type="number"
              name="averageViews"
              value={formData.averageViews}
              onChange={handleChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Average Views"
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Engagement Rate */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Engagement Rate <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Average Engagement Rate (%)
            </label>
            <input
              type="number"
              name="engagementRate"
              value={formData.engagementRate}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Engagement Rate (%)"
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
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TelegramFilterForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    username: '',
    membersCount: '',
    originalEmail: '',
    niche: '',
    age: ''
  });
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
    'Other'
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
      // Calculate score based on filled fields (20 points each = 100 total)
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = filledFields * 20;

      // Prepare filters array in the API format
      const filters = [
        { key: "username", value: formData.username, type: "string" },
        { key: "members_count", value: parseInt(formData.membersCount), type: "number" },
        { key: "original_email", value: formData.originalEmail === 'yes', type: "boolean" },
        { key: "niche", value: formData.niche, type: "string" },
        { key: "account_age_years", value: parseFloat(formData.age), type: "number" }
      ];

      
      // Pass filters back to parent with score
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting Telegram filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.username.trim() !== '' && 
           formData.membersCount.trim() !== '' && 
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
              onChange={handleChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Account Username"
            />
          </div>

          {/* Members Count */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Members Count <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Members/Subscribers
            </label>
            <input
              type="number"
              name="membersCount"
              value={formData.membersCount}
              onChange={handleChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Members"
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${
                isFormValid() && !loading
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