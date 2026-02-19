import { X, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import star from "../../assets/star.svg";
import marketplaceService from "../../services/marketplaceService";
import { useStableFormState } from "../../hooks/useStableFormState";

export const InstagramMetricForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  const [accountType, setAccountType] = useState('business');

  // 🔥 FIX: Use stable form state hook to prevent data loss on re-renders
  const defaultState = {
    followerDemographics: '',
    engagementRate: '',
    monetised: '',
    price: '',
    // Business with FB additional fields
    mediaInsights: '',
    storyViews: '',
    reelsPerformance: ''
  };

  const { formData, handleInputChange, resetForm } = useStableFormState(defaultState, existingData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requiredFields = accountType === 'business_with_fb'
        ? Object.values(formData).filter(value => value.toString().trim() !== '').length
        : [formData.followerDemographics, formData.engagementRate, formData.monetised, formData.price].filter(v => v.toString().trim() !== '').length;

      const totalFields = accountType === 'business_with_fb' ? 7 : 4;
      const score = Math.min((requiredFields / totalFields) * 100, 100);

      // Transform data to match API format
      const metrics = [];

      // Add follower demographics
      if (formData.followerDemographics) {
        metrics.push({
          key: "top_country",
          value: formData.followerDemographics,
          type: "string"
        });
      }

      // Add engagement rate
      if (formData.engagementRate) {
        metrics.push({
          key: "engagement_rate",
          value: parseFloat(formData.engagementRate),
          type: "number"
        });
      }

      // Add monetised status
      if (formData.monetised) {
        metrics.push({
          key: "is_monetised",
          value: formData.monetised === 'yes',
          type: "boolean"
        });
      }

      // Add account type
      metrics.push({
        key: "account_type",
        value: accountType,
        type: "string"
      });

      // Add additional fields for Business with FB Page
      if (accountType === 'business_with_fb') {
        if (formData.mediaInsights) {
          metrics.push({
            key: "average_post_reach",
            value: parseFloat(formData.mediaInsights),
            type: "number"
          });
        }

        if (formData.storyViews) {
          metrics.push({
            key: "average_story_views",
            value: parseFloat(formData.storyViews),
            type: "number"
          });
        }

        if (formData.reelsPerformance) {
          metrics.push({
            key: "average_reels_views",
            value: parseFloat(formData.reelsPerformance),
            type: "number"
          });
        }
      }

      // Create the payload in the required API format
      const payload = {
        platform: 'instagram',
        accountType: accountType, // Add accountType as top-level field
        price: parseFloat(formData.price) || 0,
        currency: 'usdt',
        description: `Instagram ${accountType === 'business_with_fb' ? 'Business with FB Page' : 'Business'} account`,
        quantity: 1,
        isFeatured: false,
        metrics: metrics,
        filters: [] // Will be added later in the filter form
      };

      console.log('📦 Submitting payload:', JSON.stringify(payload, null, 2));

      // Call API to create sell order with the new format
      const response = await marketplaceService.createSellOrder(payload);

      // Store the sell order ID for later use in filter form
      // Check both possible response structures
      const orderId = response?.data?._id || response?._id;
      if (orderId) {
        sessionStorage.setItem('currentSellOrderId', orderId);
      } else {
        console.warn('⚠️ No order ID found in response');
      }

      onSubmit(score);
    } catch (err) {
      setError(err.message || 'Failed to submit metrics');
      console.error('❌ Error submitting Instagram metrics:', err);
    } finally {
      setLoading(false);
    }
  };


  const isFormValid = () => {
    if (accountType === 'business') {
      return formData.followerDemographics.trim() !== '' &&
        formData.engagementRate.trim() !== '' &&
        formData.monetised !== '' &&
        formData.price.trim() !== '';
    } else {
      return formData.followerDemographics.trim() !== '' &&
        formData.engagementRate.trim() !== '' &&
        formData.monetised !== '' &&
        formData.price.trim() !== '' &&
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
          <h3 className="text-md font-semibold mb-5">Account Metrics</h3>
          <p className="text-xs font-normal text-[#868686]">
            Metrics marked with (*) are mandatory and must be provided. Ensure all required details are accurate to successfully upload your account.
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="mb-5">
          <label className="block text-sm font-normal text-[#868686] mb-2">
            Account Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="accountType"
                value="business"
                checked={accountType === 'business'}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
              />
              <span className="text-white text-sm">IG Business</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="accountType"
                value="business_with_fb"
                checked={accountType === 'business_with_fb'}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
              />
              <span className="text-white text-sm">IG Business with FB Page</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Follower Demographics */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Follower Demographics <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Top Country
            </label>
            <select
              name="followerDemographics"
              value={formData.followerDemographics}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="NG">Nigeria</option>
              <option value="IN">India</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="BR">Brazil</option>
              <option value="MX">Mexico</option>
            </select>
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
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Engagement Rate"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Price <span className="text-primary"> *</span></h2>
            </div>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Price "
            />
          </div>

          {/* Additional fields for Business with FB Page */}
          {accountType === 'business_with_fb' && (
            <>
              {/* Media Insights */}
              <div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <img src={star} alt="" />
                  <h2>Media Insights <span className="text-primary"> *</span></h2>
                </div>
                <label className="block text-sm font-normal text-[#868686] mb-2">
                  Average Post Reach
                </label>
                <input
                  type="number"
                  name="mediaInsights"
                  value={formData.mediaInsights}
                  onChange={handleInputChange}
                  className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  placeholder="Enter Average Media Reach"
                />
              </div>

              {/* Story Views */}
              <div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <img src={star} alt="" />
                  <h2>Story Views <span className="text-primary"> *</span></h2>
                </div>
                <label className="block text-sm font-normal text-[#868686] mb-2">
                  Average Story Views
                </label>
                <input
                  type="number"
                  name="storyViews"
                  value={formData.storyViews}
                  onChange={handleInputChange}
                  className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  placeholder="Enter Average Story Views"
                />
              </div>

              {/* Reels Performance */}
              <div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <img src={star} alt="" />
                  <h2>IGTV/Reels Performance <span className="text-primary"> *</span></h2>
                </div>
                <label className="block text-sm font-normal text-[#868686] mb-2">
                  Average Reels Views
                </label>
                <input
                  type="number"
                  name="reelsPerformance"
                  value={formData.reelsPerformance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  placeholder="Enter Average Reels/IGTV Views"
                />
              </div>
            </>
          )}

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

export const InstagramFilterForm = ({ isOpen, onClose, onSubmit, existingData }) => {
  // 🔥 FIX: Use stable form state hook to prevent data loss on re-renders
  const defaultState = {
    username: '',
    followers: '',
    originalEmail: '',
    dateCreated: '',
    niche: ''
  };

  const { formData, handleInputChange, resetForm } = useStableFormState(defaultState, existingData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const niches = [
    'Fashion & Beauty',
    'Fitness & Health',
    'Food & Cooking',
    'Travel',
    'Photography',
    'Art & Design',
    'Lifestyle',
    'Business & Finance',
    'Technology',
    'Entertainment',
    'Sports',
    'Gaming',
    'Education',
    'Music',
    'Parenting',
    'Pets',
    'Comedy',
    'DIY & Crafts',
    'Other'
  ];


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const filledFields = Object.values(formData).filter(value => value.toString().trim() !== '').length;
      const score = Math.min((filledFields * 20), 100);

      // Transform filters to match API format
      const filters = [];

      if (formData.username) {
        filters.push({
          key: "username",
          value: formData.username,
          type: "string"
        });
      }

      if (formData.followers) {
        filters.push({
          key: "followers",
          value: parseInt(formData.followers),
          type: "number"
        });
      }

      if (formData.originalEmail) {
        filters.push({
          key: "has_original_email",
          value: formData.originalEmail === 'yes',
          type: "boolean"
        });
      }

      if (formData.dateCreated) {
        // Calculate account age in months from date created
        const createdDate = new Date(formData.dateCreated + '-01');
        const currentDate = new Date();
        const ageInMonths = (currentDate.getFullYear() - createdDate.getFullYear()) * 12 +
          (currentDate.getMonth() - createdDate.getMonth());

        filters.push({
          key: "account_age_months",
          value: ageInMonths,
          type: "number"
        });

        filters.push({
          key: "date_created",
          value: formData.dateCreated,
          type: "string"
        });
      }

      if (formData.niche) {
        filters.push({
          key: "niche",
          value: formData.niche,
          type: "string"
        });
      }

      // Get the sell order ID from session storage
      const sellOrderId = sessionStorage.getItem('currentSellOrderId');

      if (!sellOrderId) {
        throw new Error('Please complete the metrics form first');
      }

      // Update the existing sell order with filters
      const updatePayload = {
        filters: filters
      };


      await marketplaceService.updateSellOrder(sellOrderId, updatePayload);

      // Clear the stored order ID
      sessionStorage.removeItem('currentSellOrderId');

      onSubmit(score);
    } catch (err) {
      setError(err.message || 'Failed to submit filters');
      console.error('❌ Error submitting Instagram filters:', err);
    } finally {
      setLoading(false);
    }
  };



  const isFormValid = () => {
    return formData.username.trim() !== '' &&
      formData.followers.trim() !== '' &&
      formData.originalEmail !== '' &&
      formData.dateCreated.trim() !== '' &&
      formData.niche !== '';
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
          <h3 className="text-md font-semibold mb-5">Account Filter</h3>
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
              <h2>Follower Count <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Followers
            </label>
            <input
              type="number"
              name="followers"
              value={formData.followers}
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
              Email Availability
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

          {/* Age */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Age <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Date Created
            </label>
            <input
              type="month"
              name="dateCreated"
              value={formData.dateCreated}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0] [color-scheme:dark]"
            />
          </div>

          {/* Content Niche */}
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <img src={star} alt="" />
              <h2>Content Niche <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Niche
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