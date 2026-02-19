// pinterest.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";

export const PinterestMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    pins: '',
    monthlyViews: '',
    businessAccount: '',
    clickThroughRate: ''
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

      // Prepare requirements array in the API format
      const metrics = [
        { key: "min_pins", value: parseInt(formData.pins), type: "number" },
        { key: "min_monthly_views", value: parseInt(formData.monthlyViews), type: "number" },
        { key: "requires_business_account", value: formData.businessAccount === 'yes', type: "boolean" },
        { key: "min_click_through_rate", value: parseFloat(formData.clickThroughRate), type: "number" }
      ];

      
      // Pass requirements back to parent with score
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to submit requirements');
      console.error('❌ Error submitting Pinterest requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.pins.trim() !== '' && 
           formData.monthlyViews.trim() !== '' && 
           formData.businessAccount !== '' && 
           formData.clickThroughRate.trim() !== '';
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
          {/* Pins */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Pins <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Number of Pins
            </label>
            <input
              type="number"
              name="pins"
              value={formData.pins}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Number of Pins"
            />
          </div>

          {/* Monthly Views */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Monthly Views <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Monthly Profile Views
            </label>
            <input
              type="number"
              name="monthlyViews"
              value={formData.monthlyViews}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Monthly Views"
            />
          </div>

          {/* Business Account */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Requires Business Account <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Require Business Account?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="businessAccount"
                  value="yes"
                  checked={formData.businessAccount === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="businessAccount"
                  value="no"
                  checked={formData.businessAccount === 'no'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Click Through Rate */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Click Through Rate <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Click Through Rate (%)
            </label>
            <input
              type="number"
              name="clickThroughRate"
              value={formData.clickThroughRate}
              onChange={handleInputChange}
              step="0.1"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Click Through Rate"
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

export const PinterestFilterForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    followersCount: '',
    originalEmail: '',
    niche: '',
    age: ''
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
        { key: "min_followers", value: parseInt(formData.followersCount), type: "number" },
        { key: "requires_original_email", value: formData.originalEmail === 'yes', type: "boolean" },
        { key: "preferred_niche", value: formData.niche, type: "string" },
        { key: "min_age", value: parseFloat(formData.age), type: "number" }
      ];

      
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting Pinterest filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.followersCount.trim() !== '' && 
           formData.originalEmail !== '' && 
           formData.niche !== '' && 
           formData.age.trim() !== '';
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

          {/* Minimum Followers Count */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Followers Count <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Number of Followers
            </label>
            <input
              type="number"
              name="followersCount"
              value={formData.followersCount}
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
              Require Original Email?
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

          {/* Preferred Niche */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Preferred Niche <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Preferred Content Niche
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

          {/* Minimum Age */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Minimum Age <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Minimum Account Age (Years)
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Minimum Account Age in Years"
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