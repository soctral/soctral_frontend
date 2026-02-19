import { X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import star from "../../assets/star.svg";

export const TumblrMetricForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    followers: '',
    likes: '',
    posts: '',
    engagement: '',
    pageViews: '',
    reach: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Calculate score based on filled fields (example logic)
    const filledFields = Object.values(formData).filter(value => value.trim() !== '').length;
    const score = Math.min((filledFields * 15), 100); // Each field adds 15 points, max 100
    onSubmit(score);
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

<p className="text-xs font-normal text-[#868686]"> Metrics marked with (*) are mandatory and must be provided. Ensure all required details are accurate to successfully upload your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">


          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                            <h2>Account Username <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Username
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

     
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                            <h2>Content Niche <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Niche
            </label>
            <input
              type="text"
              name="niche"
              value={formData.niche}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Content Niche"
            />
          </div>

        
          <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                            <h2>Recent Posts</h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Posts
            </label>
            <input
              type="text"
              name="post"
              value={formData.post}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Posts"
            />
          </div>

           <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                            <h2>Ad Performance</h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Likes
            </label>
            <input
              type="number"
              name="likes"
              value={formData.likes}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Likes"
            />


 <label className="block text-sm font-normal text-[#868686]  mt-2 mb-2">
              Comments
            </label>
              <input
              type="number"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Comments"
            />



 <label className="block text-sm font-normal text-[#868686] mt-2 mb-2">
              Share
            </label>
              <input
              type="number"
              name="share"
              value={formData.share}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Number of Shares"
            />
          </div>


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
        name="emailAvailability"
        value="yes"
        checked={formData.emailAvailability === 'yes'}
        onChange={handleInputChange}
        className="w-4 h-4 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2 checked:border-purple-600"
      />
      <span className="text-white text-sm">Yes</span>
    </label>
    
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="emailAvailability"
        value="no"
        checked={formData.emailAvailability === 'no'}
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
                            <h2>Original Email <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Email Address"
            />
          </div>

               <div>
            <div className="flex items-center gap-1 text-sm mb-2">
                <img src={star} alt="" />
                            <h2>Original Email Password <span className="text-primary"> *</span></h2>
            </div>
            <label className="block text-sm font-normal text-[#868686] mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              placeholder="Enter Password"
            />
          </div>


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




          <div className="flex gap-3 pt-4">

            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#613cd0] text-white rounded-full hover:bg-[#7050d5] transition-colors"
            >
Upload            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TumblrFilterForm = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFilters, setSelectedFilters] = useState([]);

  const filters = [
    'Business Page',
    'Personal Profile',
    'Verified Account',
    'High Engagement',
    'Active Daily',
    'Content Creator',
    'Local Business',
    'Brand Partnership',
    'Monetized',
    'Gaming',
    'News & Media',
    'Entertainment'
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
    // Calculate score based on selected filters
    const score = Math.min((selectedFilters.length * 10), 100); // Each filter adds 10 points, max 100
    onSubmit(score);
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

        <p className="text-[#868686] text-sm mb-4">
          Select at least 3 filters that describe your Facebook account
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