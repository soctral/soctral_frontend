// updateUploadAccount/qoura.jsx
import { X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";

export const QouraMetricForm = ({ isOpen, onClose, onSubmit, existingData, accountId }) => {
  const [formData, setFormData] = useState({
    answers: '',
    totalViews: '',
    topWriter: '',
    upvoteRatio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('📝 Quora Metrics Form - existingData:', existingData);
    if (existingData && Array.isArray(existingData)) {
      const newData = { ...formData };
      existingData.forEach(item => {
        console.log('Processing metric item:', item);
        switch (item.key) {
          case "answers":
            newData.answers = item.value.toString();
            break;
          case "total_views":
            newData.totalViews = item.value.toString();
            break;
          case "is_top_writer":
            newData.topWriter = item.value ? 'yes' : 'no';
            break;
          case "upvote_ratio":
            newData.upvoteRatio = item.value.toString();
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
        { key: "answers", value: parseInt(formData.answers), type: "number" },
        { key: "total_views", value: parseInt(formData.totalViews), type: "number" },
        { key: "is_top_writer", value: formData.topWriter === 'yes', type: "boolean" },
        { key: "upvote_ratio", value: parseFloat(formData.upvoteRatio), type: "number" }
      ];

      console.log('Account ID:', accountId);
      
      onSubmit(score, 'metrics', metrics);
    } catch (err) {
      setError(err.message || 'Failed to update metrics');
      console.error('❌ Error updating Quora metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.answers.trim() !== '' && 
           formData.totalViews.trim() !== '' && 
           formData.topWriter !== '' && 
           formData.upvoteRatio.trim() !== '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10003] rounded-md flex items-center justify-center overflow-y-auto">
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

        <h2 className="text-white text-lg font-semibold mb-6 text-center">Update Quora Metrics</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Answers */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Answers <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Number of Answers
            </label>
            <input
              type="number"
              name="answers"
              value={formData.answers}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Answers"
            />
          </div>

          {/* Total Views */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Total Views <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Total Views
            </label>
            <input
              type="number"
              name="totalViews"
              value={formData.totalViews}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Total Views"
            />
          </div>

          {/* Top Writer */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Top Writer <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Is Top Writer?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="topWriter"
                  value="yes"
                  checked={formData.topWriter === 'yes'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="topWriter"
                  value="no"
                  checked={formData.topWriter === 'no'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
                />
                <span className="text-white text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Upvote Ratio */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Upvote Ratio <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Upvote Ratio (%)
            </label>
            <input
              type="number"
              name="upvoteRatio"
              value={formData.upvoteRatio}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Upvote Ratio"
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
              {loading ? 'Updating...' : 'Update Metrics'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const QouraFilterForm = ({ isOpen, onClose, onSubmit, existingData, accountId }) => {
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
    console.log('📝 Quora Filters Form - existingData:', existingData);
    if (existingData && Array.isArray(existingData)) {
      const newData = { ...formData };
      existingData.forEach(item => {
        console.log('Processing filter item:', item);
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

      console.log('Account ID:', accountId);
      
      onSubmit(score, 'filters', filters);
    } catch (err) {
      setError(err.message || 'Failed to update filters');
      console.error('❌ Error updating Quora filters:', err);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10003] rounded-md flex items-center justify-center overflow-y-auto">
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

        <h2 className="text-white text-lg font-semibold mb-6 text-center">Update Quora Filters</h2>

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
              {loading ? 'Updating...' : 'Update Filters'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};