// mewe.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";

export const MeweMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    posts: '',
    contacts: '',
    premium: '',
    interactionRate: ''
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
      const score = filledFields * 25;

      const metrics = [
        { key: "posts", value: parseInt(formData.posts), type: "number" },
        { key: "contacts", value: parseInt(formData.contacts), type: "number" },
        { key: "is_premium", value: formData.premium === 'yes', type: "boolean" },
        { key: "interaction_rate", value: parseFloat(formData.interactionRate), type: "number" }
      ];

      
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to submit metrics');
      console.error('❌ Error submitting MeWe metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.posts.trim() !== '' && 
           formData.contacts.trim() !== '' && 
           formData.premium !== '' && 
           formData.interactionRate.trim() !== '';
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
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Posts <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Posts
            </label>
            <input
              type="number"
              name="posts"
              value={formData.posts}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Posts"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Contacts <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Contacts
            </label>
            <input
              type="number"
              name="contacts"
              value={formData.contacts}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Contacts"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Premium <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Has Premium Subscription?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="premium"
                  value="yes"
                  checked={formData.premium === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="premium"
                  value="no"
                  checked={formData.premium === 'no'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Interaction Rate <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Average Interaction Rate (%)
            </label>
            <input
              type="number"
              name="interactionRate"
              value={formData.interactionRate}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Interaction Rate (%)"
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

export const MeweFilterForm = ({ isOpen, onClose, onSubmit, existingData }) => {
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
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = filledFields * 20;

      const filters = [
        { key: "username", value: formData.username, type: "string" },
        { key: "followers_count", value: parseInt(formData.followersCount), type: "number" },
        { key: "original_email", value: formData.originalEmail === 'yes', type: "boolean" },
        { key: "niche", value: formData.niche, type: "string" },
        { key: "account_age_years", value: parseFloat(formData.age), type: "number" }
      ];

      
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting MeWe filters:', err);
    } finally {
      setLoading(false);
    }
  };

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