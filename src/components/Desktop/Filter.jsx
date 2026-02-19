import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import face from "../../assets/face.svg";
import twitter from "../../assets/twitter.svg";
import tiktok from "../../assets/tiktok.svg";
import ig from "../../assets/ig.svg";
import linkedin from "../../assets/linkedin.svg";
import snap from "../../assets/snapchat.svg";
import youtube from "../../assets/youtube.svg";
import telegram from "../../assets/telegram.svg";
import discord from "../../assets/discord.svg";
import pinterest from "../../assets/pinterest.svg";
import reddit from "../../assets/reddit.svg";
import wechat from "../../assets/wechat.svg";
import onlyfans from "../../assets/onlyfans.svg";
import flickr from "../../assets/flickr.svg";
import vimeo from "../../assets/vimeo.svg";
import qzone from "../../assets/qzone.svg";
import qoura from "../../assets/qoura.svg";
import twitch from "../../assets/twitch.svg";
import tumblr from "../../assets/tumblr.svg";
import mewe from "../../assets/mewe.svg";

const Filter = ({ isOpen, onClose, onApplyFilters }) => {
  const [selectedButton, setSelectedButton] = useState(null);
  const [subscriberRange, setSubscriberRange] = useState({ from: "", to: "" });
  const [accountAgeRange, setAccountAgeRange] = useState({ from: "", to: "" });
  const [videoCountRange, setVideoCountRange] = useState({ from: "", to: "" });
  const [viewCountRange, setViewCountRange] = useState({ from: "", to: "" });
  const [originalEmail, setOriginalEmail] = useState("");
  const [username, setUsername] = useState("");
  const [niche, setNiche] = useState("");
  const [monetized, setMonetized] = useState("");
  const [verified, setVerified] = useState("");
  const [accountType, setAccountType] = useState("");

  const buttons = [
    { id: "facebook", label: "Facebook", icon: face },
    { id: "tiktok", label: "TikTok", icon: tiktok },
    { id: "instagram", label: "Instagram", icon: ig },
    { id: "twitter", label: "Twitter", icon: twitter },
    { id: "linkedin", label: "LinkedIn", icon: linkedin },
    { id: "youtube", label: "YouTube", icon: youtube },
    { id: "snapchat", label: "Snapchat", icon: snap },
    { id: "telegram", label: "Telegram", icon: telegram },
    { id: "discord", label: "Discord", icon: discord },
    { id: "pinterest", label: "Pinterest", icon: pinterest },
    { id: "wechat", label: "WeChat", icon: wechat },
    { id: "reddit", label: "Reddit", icon: reddit },
    { id: "onlyfans", label: "OnlyFans", icon: onlyfans },
    { id: "flickr", label: "Flickr", icon: flickr },
    { id: "vimeo", label: "Vimeo", icon: vimeo },
    { id: "qzone", label: "QZone", icon: qzone },
    { id: "qoura", label: "Quora", icon: qoura },
    { id: "twitch", label: "Twitch", icon: twitch },
    { id: "tumblr", label: "Tumblr", icon: tumblr },
    { id: "mewe", label: "Mewe", icon: mewe },
  ];

  const subscriberRanges = [
    "200-500", "500-1K", "1K-2K", "2K-5K", "5K-10K", 
    "10K-50K", "50K-100K", "100K-500K", "500K-1M", "1M+"
  ];

  const accountAgeRanges = [
    "1-5Years", "5-10Years", "10-15Years", "15-20Years", 
    "25-30Years", "30Years+"
  ];

  const videoCountRanges = [
    "0-100", "100-200", "200-300", "300-400", "400-500",
    "500-600", "600-700", "700-800", "800-900", "1000+"
  ];

  const viewCountRanges = [
    "200-500", "500-1K", "1K-2K", "2K-5K", "5K-10K",
    "10K-50K", "50K-100K", "100K-500K", "500K-1M", "1M+"
  ];

  const niches = [
    "Entertainment", "Lifestyle", "Fashion", "Technology", "Business",
    "Education", "Gaming", "Sports", "Travel", "Food", "Health", "Music",
    "Art", "Comedy", "News", "Politics", "Science", "Beauty", "Fitness"
  ];

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany",
    "France", "Japan", "Brazil", "India", "Nigeria", "South Africa", "Other"
  ];

  const handleButtonClick = (buttonId) => {
    setSelectedButton(buttonId);
  };

  const handleRangeClick = (range, type) => {
    const [from, to] = range.includes('+') ? [range.replace('+', ''), ''] : range.split('-');
    
    if (type === 'subscriber') {
      setSubscriberRange({ from, to });
    } else if (type === 'age') {
      setAccountAgeRange({ from, to });
    } else if (type === 'video') {
      setVideoCountRange({ from, to });
    } else if (type === 'view') {
      setViewCountRange({ from, to });
    }
  };

  const handleApplyFilters = () => {
    const activeFilters = [];
    
    if (selectedButton) {
      const platformData = buttons.find(btn => btn.id === selectedButton);
      activeFilters.push({
        type: 'platform',
        value: selectedButton,
        label: platformData.label,
        icon: platformData.icon
      });
    }

    if (username) {
      activeFilters.push({
        type: 'username',
        value: username,
        label: `Username: ${username}`
      });
    }

    if (niche) {
      activeFilters.push({
        type: 'niche',
        value: niche,
        label: `Niche: ${niche}`
      });
    }

    if (subscriberRange.from || subscriberRange.to) {
      const rangeLabel = subscriberRange.to 
        ? `${subscriberRange.from}-${subscriberRange.to}` 
        : `${subscriberRange.from}+`;
      activeFilters.push({
        type: 'subscribers',
        value: subscriberRange,
        label: `Subscribers: ${rangeLabel}`
      });
    }

    if (accountAgeRange.from || accountAgeRange.to) {
      const rangeLabel = accountAgeRange.to 
        ? `${accountAgeRange.from}-${accountAgeRange.to}` 
        : `${accountAgeRange.from}+`;
      activeFilters.push({
        type: 'accountAge',
        value: accountAgeRange,
        label: `Age: ${rangeLabel}`
      });
    }

    if (videoCountRange.from || videoCountRange.to) {
      const rangeLabel = videoCountRange.to 
        ? `${videoCountRange.from}-${videoCountRange.to}` 
        : `${videoCountRange.from}+`;
      activeFilters.push({
        type: 'videoCount',
        value: videoCountRange,
        label: `Videos: ${rangeLabel}`
      });
    }

    if (viewCountRange.from || viewCountRange.to) {
      const rangeLabel = viewCountRange.to 
        ? `${viewCountRange.from}-${viewCountRange.to}` 
        : `${viewCountRange.from}+`;
      activeFilters.push({
        type: 'viewCount',
        value: viewCountRange,
        label: `Views: ${rangeLabel}`
      });
    }

    if (originalEmail) {
      activeFilters.push({
        type: 'originalEmail',
        value: originalEmail,
        label: `Original Email: ${originalEmail === 'yes' ? 'Yes' : 'No'}`
      });
    }

    if (monetized) {
      activeFilters.push({
        type: 'monetized',
        value: monetized,
        label: `Monetized: ${monetized === 'yes' ? 'Yes' : 'No'}`
      });
    }

    if (verified) {
      activeFilters.push({
        type: 'verified',
        value: verified,
        label: `Verified: ${verified === 'yes' ? 'Yes' : 'No'}`
      });
    }

    if (accountType) {
      activeFilters.push({
        type: 'accountType',
        value: accountType,
        label: `Type: ${accountType}`
      });
    }

    if (onApplyFilters) {
      onApplyFilters(activeFilters);
    }
    onClose();
  };

  const credibilityScore = 75;

  const getBorderColor = (score) => {
    if (score >= 80) return "border-green-500";
    if (score >= 60) return "border-yellow-500";
    return "border-red-500";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  // Platform-specific filter sections based on documentation
  const renderPlatformSpecificFilters = () => {
    if (!selectedButton) return null;

    const commonFields = (
      <>
        {/* Username Field */}
        <div className="mb-4">
          <label className="text-[#868686] text-xs mb-2 block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
            placeholder="Enter username"
          />
        </div>

        {/* Niche Dropdown */}
        <div className="mb-4">
          <label className="text-[#868686] text-xs mb-2 block">Niche</label>
          <div className="relative">
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
            >
              <option value="">Select niche</option>
              {niches.map((n) => (
                <option key={n} value={n} className="bg-[#181818]">{n}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </>
    );

    switch (selectedButton) {
      case 'facebook':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Facebook Specific Filters</h3>
            {commonFields}
            
            {/* Monetized Account */}
            <div className="mb-4">
              <h4 className="text-white font-semibold text-sm mb-2">Monetized Account</h4>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="monetized"
                    value="yes"
                    checked={monetized === "yes"}
                    onChange={(e) => setMonetized(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                    monetized === "yes" 
                      ? "border-[#613cd0] bg-[#613cd0]" 
                      : "border-gray-400"
                  }`}>
                    {monetized === "yes" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white text-sm">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="monetized"
                    value="no"
                    checked={monetized === "no"}
                    onChange={(e) => setMonetized(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                    monetized === "no" 
                      ? "border-[#613cd0] bg-[#613cd0]" 
                      : "border-gray-400"
                  }`}>
                    {monetized === "no" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white text-sm">No</span>
                </label>
              </div>
            </div>

            {/* Follower Demographics */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Top Country</label>
              <div className="relative">
                <select
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country} value={country} className="bg-[#181818]">{country}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Instagram Specific Filters</h3>
            {commonFields}
            
            {/* Monetized Account */}
            <div className="mb-4">
              <h4 className="text-white font-semibold text-sm mb-2">Monetized Account</h4>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="monetized"
                    value="yes"
                    checked={monetized === "yes"}
                    onChange={(e) => setMonetized(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                    monetized === "yes" 
                      ? "border-[#613cd0] bg-[#613cd0]" 
                      : "border-gray-400"
                  }`}>
                    {monetized === "yes" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white text-sm">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="monetized"
                    value="no"
                    checked={monetized === "no"}
                    onChange={(e) => setMonetized(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                    monetized === "no" 
                      ? "border-[#613cd0] bg-[#613cd0]" 
                      : "border-gray-400"
                  }`}>
                    {monetized === "no" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white text-sm">No</span>
                </label>
              </div>
            </div>

            {/* Top Country */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Top Country</label>
              <div className="relative">
                <select className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8">
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country} value={country} className="bg-[#181818]">{country}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'twitter':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Twitter/X Specific Filters</h3>
            {commonFields}
            
            {/* Account Type */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Account Type</label>
              <div className="relative">
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select type</option>
                  <option value="basic" className="bg-[#181818]">Basic</option>
                  <option value="premium" className="bg-[#181818]">Premium</option>
                  <option value="premium+" className="bg-[#181818]">Premium+</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'youtube':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">YouTube Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Channel Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter channel username"
              />
            </div>
            
            {/* Niche */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Niche</label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select niche</option>
                  {niches.map((n) => (
                    <option key={n} value={n} className="bg-[#181818]">{n}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Subscribers Range */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Subscribers</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={subscriberRange.from}
                  onChange={(e) => setSubscriberRange({...subscriberRange, from: e.target.value})}
                  placeholder="Min subscribers"
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                />
                <input
                  type="text"
                  value={subscriberRange.to}
                  onChange={(e) => setSubscriberRange({...subscriberRange, to: e.target.value})}
                  placeholder="Max subscribers"
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'linkedin':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">LinkedIn Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>
            
            {/* Connection Count Range */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Connection Count</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Min connections"
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Max connections"
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'tiktok':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">TikTok Specific Filters</h3>
            {commonFields}
          </div>
        );

      case 'snapchat':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Snapchat Specific Filters</h3>
            {commonFields}
          </div>
        );

      case 'pinterest':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Pinterest Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>
          </div>
        );

      case 'reddit':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Reddit Specific Filters</h3>
            {commonFields}
            
            {/* Subreddit Community */}
            <div className="mb-4">
              <h4 className="text-white font-semibold text-sm mb-2">Subreddit Community</h4>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="verified"
                    value="yes"
                    checked={verified === "yes"}
                    onChange={(e) => setVerified(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                    verified === "yes" 
                      ? "border-[#613cd0] bg-[#613cd0]" 
                      : "border-gray-400"
                  }`}>
                    {verified === "yes" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white text-sm">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="verified"
                    value="no"
                    checked={verified === "no"}
                    onChange={(e) => setVerified(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                    verified === "no" 
                      ? "border-[#613cd0] bg-[#613cd0]" 
                      : "border-gray-400"
                  }`}>
                    {verified === "no" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white text-sm">No</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'twitch':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Twitch Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Channel Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter channel username"
              />
            </div>
            
            {/* Niche */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Niche</label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select niche</option>
                  {niches.map((n) => (
                    <option key={n} value={n} className="bg-[#181818]">{n}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'onlyfans':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">OnlyFans Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Gender</label>
              <div className="relative">
                <select className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8">
                  <option value="">Select gender</option>
                  <option value="male" className="bg-[#181818]">Male</option>
                  <option value="female" className="bg-[#181818]">Female</option>
                  <option value="other" className="bg-[#181818]">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Subscriber Count Range */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Subscriber Count</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={subscriberRange.from}
                  onChange={(e) => setSubscriberRange({...subscriberRange, from: e.target.value})}
                  placeholder="Min subscribers"
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                />
                <input
                  type="text"
                  value={subscriberRange.to}
                  onChange={(e) => setSubscriberRange({...subscriberRange, to: e.target.value})}
                  placeholder="Max subscribers"
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'flickr':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Flickr Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>

            {/* Account Type */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Account Type</label>
              <div className="relative">
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select type</option>
                  <option value="free" className="bg-[#181818]">Free</option>
                  <option value="pro" className="bg-[#181818]">Pro</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'vimeo':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Vimeo Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>

            {/* Niche */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Niche</label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select niche</option>
                  {niches.map((n) => (
                    <option key={n} value={n} className="bg-[#181818]">{n}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Account Type */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Account Type</label>
              <div className="relative">
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select type</option>
                  <option value="basic" className="bg-[#181818]">Basic</option>
                  <option value="plus" className="bg-[#181818]">Plus</option>
                  <option value="pro" className="bg-[#181818]">Pro</option>
                  <option value="business" className="bg-[#181818]">Business</option>
                  <option value="premium" className="bg-[#181818]">Premium</option>
                  <option value="enterprise" className="bg-[#181818]">Enterprise</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'wechat':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">WeChat Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Account Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter account username"
              />
            </div>

            {/* Account Type */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Account Type</label>
              <div className="relative">
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select type</option>
                  <option value="subscription" className="bg-[#181818]">Subscription Account</option>
                  <option value="service" className="bg-[#181818]">Service Account</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'qoura':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Quora Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>

            {/* Niche */}
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Niche</label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm appearance-none pr-8"
                >
                  <option value="">Select niche</option>
                  {niches.map((n) => (
                    <option key={n} value={n} className="bg-[#181818]">{n}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        );

      case 'qzone':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">QZone Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>
          </div>
        );

      case 'tumblr':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Tumblr Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>
          </div>
        );

      case 'mewe':
        return (
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h3 className="text-white font-semibold text-sm mb-4">Mewe Specific Filters</h3>
            <div className="mb-4">
              <label className="text-[#868686] text-xs mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                placeholder="Enter username"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/100 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center lg:p-4">
        <div className="bg-gradient-to-b from-black/90 via-black/80 to-black/90 rounded-lg w-full max-w-screen-sm lg:mx-4 relative max-h-full lg:max-h-[90vh] flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex-1 overflow-y-auto px-6 pt-6">
            <h2 className="text-white text-lg font-semibold mb-6">Filter</h2>
            
            {/* Social Account Section */}
            <div className="mb-6">
              <p className="text-[#868686] font-semibold text-sm mb-4">
                Social Account
              </p>
              
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {buttons.map((button) => (
                  <button
                    key={button.id}
                    onClick={() => handleButtonClick(button.id)}
                    className={`flex gap-2 items-center justify-center p-2 rounded-full transition-all duration-200 ${
                      selectedButton === button.id 
                        ? "bg-[#613cd0] hover:bg-[#7050d5]" 
                        : " hover:bg-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    <div className="lg:bg-[rgba(255,255,255,0.1)] lg:p-3 rounded-full "> 
                    <img src={button.icon} className="h-12 w-12 lg:h-6 lg:w-6 " alt={button.label} />

                    </div>
                    <p className="text-xs font-medium text-white">{button.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Specific Filters */}
            {renderPlatformSpecificFilters()}

            {/* Show remaining filters only if a platform is selected */}
            {selectedButton && (
              <>
                {/* Subscriber Count Section - Only show if no platform selected or platform uses it */}
                {(['facebook', 'instagram', 'tiktok', 'snapchat', 'youtube', 'wechat', 'onlyfans', 'qoura'].includes(selectedButton)) && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-4">
                      {selectedButton === 'youtube' ? 'Subscriber Count' : selectedButton === 'facebook' || selectedButton === 'instagram' ? 'Follower Count' : 'Subscriber/Follower Count'}
                    </h3>
                    
                    <div className="mb-4">
                      <p className="text-[#868686] text-xs mb-2">Input Range</p>
                      <div className="flex gap-3 items-center">
                        <div>
                          <label className="text-[#868686] text-xs">From:</label>
                          <input
                            type="text"
                            value={subscriberRange.from}
                            onChange={(e) => setSubscriberRange({...subscriberRange, from: e.target.value})}
                            className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[#868686] text-xs">To:</label>
                          <input
                            type="text"
                            value={subscriberRange.to}
                            onChange={(e) => setSubscriberRange({...subscriberRange, to: e.target.value})}
                            className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                            placeholder="1000000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#868686] text-xs mb-2">Select Range</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {subscriberRanges.map((range) => (
                          <button
                            key={range}
                            onClick={() => handleRangeClick(range, 'subscriber')}
                            className="p-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-full text-white text-xs transition-colors"
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Age Section */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold text-sm mb-4">Account Age</h3>
                  
                  <div className="mb-4">
                    <p className="text-[#868686] text-xs mb-2">Input Range</p>
                    <div className="flex gap-3 items-center">
                      <div>
                        <label className="text-[#868686] text-xs">From:</label>
                        <input
                          type="text"
                          value={accountAgeRange.from}
                          onChange={(e) => setAccountAgeRange({...accountAgeRange, from: e.target.value})}
                          className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="text-[#868686] text-xs">To:</label>
                        <input
                          type="text"
                          value={accountAgeRange.to}
                          onChange={(e) => setAccountAgeRange({...accountAgeRange, to: e.target.value})}
                          className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[#868686] text-xs mb-2">Select Range</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {accountAgeRanges.map((range) => (
                        <button
                          key={range}
                          onClick={() => handleRangeClick(range, 'age')}
                          className="p-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-full text-white text-xs transition-colors"
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video Count Section - Only for platforms that have videos */}
                {(['youtube', 'tiktok', 'twitch', 'vimeo'].includes(selectedButton)) && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-4">Video Count</h3>
                    
                    <div className="mb-4">
                      <p className="text-[#868686] text-xs mb-2">Input Range</p>
                      <div className="flex gap-3 items-center">
                        <div>
                          <label className="text-[#868686] text-xs">From:</label>
                          <input
                            type="text"
                            value={videoCountRange.from}
                            onChange={(e) => setVideoCountRange({...videoCountRange, from: e.target.value})}
                            className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[#868686] text-xs">To:</label>
                          <input
                            type="text"
                            value={videoCountRange.to}
                            onChange={(e) => setVideoCountRange({...videoCountRange, to: e.target.value})}
                            className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                            placeholder="1000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#868686] text-xs mb-2">Select Range</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {videoCountRanges.map((range) => (
                          <button
                            key={range}
                            onClick={() => handleRangeClick(range, 'video')}
                            className="p-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-full text-white text-xs transition-colors"
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Channel View Count Section - Only for platforms with views */}
                {(['youtube', 'tiktok', 'twitch', 'vimeo', 'onlyfans', 'qoura'].includes(selectedButton)) && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-4">
                      {selectedButton === 'youtube' ? 'Total Channel View Count' : 'View Count'}
                    </h3>
                    
                    <div className="mb-4">
                      <p className="text-[#868686] text-xs mb-2">Input Range</p>
                      <div className="flex gap-3 items-center">
                        <div>
                          <label className="text-[#868686] text-xs">From:</label>
                          <input
                            type="text"
                            value={viewCountRange.from}
                            onChange={(e) => setViewCountRange({...viewCountRange, from: e.target.value})}
                            className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                            placeholder="200"
                          />
                        </div>
                        <div>
                          <label className="text-[#868686] text-xs">To:</label>
                          <input
                            type="text"
                            value={viewCountRange.to}
                            onChange={(e) => setViewCountRange({...viewCountRange, to: e.target.value})}
                            className="w-full mt-1 p-2 bg-[rgba(255,255,255,0.1)] border border-gray-600 rounded-full text-white text-sm"
                            placeholder="1000000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#868686] text-xs mb-2">Select Range</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {viewCountRanges.map((range) => (
                          <button
                            key={range}
                            onClick={() => handleRangeClick(range, 'view')}
                            className="p-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-full text-white text-xs transition-colors"
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Original Email Section - Changed to radio inputs */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold text-sm mb-4">Original Email</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="originalEmail"
                        value="yes"
                        checked={originalEmail === "yes"}
                        onChange={(e) => setOriginalEmail(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                        originalEmail === "yes" 
                          ? "border-[#613cd0] bg-[#613cd0]" 
                          : "border-gray-400"
                      }`}>
                        {originalEmail === "yes" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-white text-sm">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="originalEmail"
                        value="no"
                        checked={originalEmail === "no"}
                        onChange={(e) => setOriginalEmail(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                        originalEmail === "no" 
                          ? "border-[#613cd0] bg-[#613cd0]" 
                          : "border-gray-400"
                      }`}>
                        {originalEmail === "no" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-white text-sm">No</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Apply Button - Only show if an account is selected */}
            {selectedButton && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-600 sticky bottom-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 mt-6 -mx-6 px-6 pb-6">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-full hover:bg-[rgba(255,255,255,0.15)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-[#613cd0] text-white rounded-full hover:bg-[#7050d5] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Filter;