// snapchat.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";

export const SnapchatMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    snaps: '',
    followers: '',
    spotlight: '',
    openRate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingData && Array.isArray(existingData)) {
      const newData = { ...formData };
      existingData.forEach(item => {
        switch (item.key) {
          case "snaps":
            newData.snaps = item.value.toString();
            break;
          case "followers":
            newData.followers = item.value.toString();
            break;
          case "has_spotlight":
            newData.spotlight = item.value ? 'yes' : 'no';
            break;
          case "open_rate":
            newData.openRate = item.value.toString();
            break;
        }
      });
      setFormData(newData);
    }
  }, [existingData]);

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
        { key: "snaps", value: parseInt(formData.snaps), type: "number" },
        { key: "followers", value: parseInt(formData.followers), type: "number" },
        { key: "has_spotlight", value: formData.spotlight === 'yes', type: "boolean" },
        { key: "open_rate", value: parseFloat(formData.openRate), type: "number" }
      ];

      
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to submit metrics');
      console.error('❌ Error submitting Snapchat metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.snaps.trim() !== '' && 
           formData.followers.trim() !== '' && 
           formData.spotlight !== '' && 
           formData.openRate.trim() !== '';
  };

  const isUpdate = !!existingData;

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

        <h2 className="text-white text-lg font-semibold mb-6 text-center">Snapchat Metrics</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Snaps */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Snaps <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Snaps
            </label>
            <input
              type="number"
              name="snaps"
              value={formData.snaps}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Snaps"
            />
          </div>

          {/* Followers */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Followers <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Followers
            </label>
            <input
              type="number"
              name="followers"
              value={formData.followers}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Followers"
            />
          </div>

          {/* Spotlight */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Spotlight <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Has Spotlight?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="spotlight"
                  value="yes"
                  checked={formData.spotlight === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="spotlight"
                  value="no"
                  checked={formData.spotlight === 'no'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Open Rate */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Open Rate <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Open Rate (%)
            </label>
            <input
              type="number"
              name="openRate"
              value={formData.openRate}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Open Rate"
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
              {loading ? 'Submitting...' : isUpdate ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SnapchatFilterForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [formData, setFormData] = useState({
    followers: '',
    verified: '',
    niche: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const niches = [
    "Art & Design", "Comedy", "Education", "Entertainment", "Gaming",
    "Health & Fitness", "Lifestyle", "Music", "News & Politics", "Science & Tech",
    "Sports", "Travel", "Other"
  ];

  useEffect(() => {
    if (existingData && Array.isArray(existingData)) {
      const newData = { ...formData };
      existingData.forEach(item => {
        switch (item.key) {
          case "followers":
            newData.followers = item.value.toString();
            break;
          case "is_verified":
            newData.verified = item.value ? 'yes' : 'no';
            break;
          case "niche":
            newData.niche = item.value;
            break;
          case "age":
            newData.age = item.value.toString();
            break;
        }
      });
      setFormData(newData);
    }
  }, [existingData]);

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

      const filters = [
        { key: "followers", value: parseInt(formData.followers), type: "number" },
        { key: "is_verified", value: formData.verified === 'yes', type: "boolean" },
        { key: "niche", value: formData.niche, type: "string" },
        { key: "age", value: parseFloat(formData.age), type: "number" }
      ];

      
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting Snapchat filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.followers.trim() !== '' && 
           formData.verified !== '' && 
           formData.niche !== '' && 
           formData.age.trim() !== '';
  };

  const isUpdate = !!existingData;

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

        <h2 className="text-white text-lg font-semibold mb-6 text-center">Snapchat Filters</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Followers */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Followers <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Followers
            </label>
            <input
              type="number"
              name="followers"
              value={formData.followers}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Followers"
            />
          </div>

          {/* Verified */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Verified <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Is Verified?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verified"
                  value="yes"
                  checked={formData.verified === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verified"
                  value="no"
                  checked={formData.verified === 'no'}
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
              className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${
                isFormValid() && !loading
                  ? 'bg-[#613cd0] hover:bg-[#7050d5]' 
                  : 'bg-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Submitting...' : isUpdate ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};