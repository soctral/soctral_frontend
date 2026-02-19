import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Bell } from "lucide-react";
import bell from "../../assets/newBell.png"
import Ellipse from "../../assets/Ellipse.svg"
import Gen from "../../assets/gen.svg"

import RedLine from "../../assets/redLine.svg"
import GreenLine from "../../assets/greenLine.svg"



const Notification = ({ showNotificationPanel, setShowNotificationPanel, isAuthenticated }) => {
  const [activeTab, setActiveTab] = useState("All");
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState({
    All: [
      {
        id: 1,
        type: "News",
        title: "Facebook Launches Mask Feature",
        message: "Facebook Launches Mask Feature",
        time: "10:30am",
        action: "Read More",
        description: "Facebook Launches The Most Talked About Feature (The Mask Feature)...",
        hasImage: true
      },
      {
        id: 2,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) is down -5.98% in the last 24 hours",
        priceChange: "-5.98%",
        isNegative: true
      },
      {
        id: 3,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) rises +5.98% in the last 24 hours",
        priceChange: "+5.98%",
        isNegative: false
      },
      {
        id: 4,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) is down -5.98% in the last 24 hours",
        priceChange: "-5.98%",
        isNegative: true
      },
      {
        id: 5,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) is down -5.98% in the last 24 hours",
        priceChange: "-5.98%",
        isNegative: true
      }
    ],
    News: [
      {
        id: 1,
        type: "News",
        title: "Facebook Launches Mask Feature",
        message: "Facebook Launches Mask Feature",
        time: "10:30am",
        action: "Read More",
        description: "Facebook Launches The Most Talked About Feature (The Mask Feature)...",
        hasImage: true
      }
    ],
    "In-App Alerts": [
      {
        id: 2,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) is down -5.98% in the last 24 hours",
        priceChange: "-5.98%",
        isNegative: true
      },
      {
        id: 3,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) rises +5.98% in the last 24 hours",
        priceChange: "+5.98%",
        isNegative: false
      },
      {
        id: 4,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) is down -5.98% in the last 24 hours",
        priceChange: "-5.98%",
        isNegative: true
      },
      {
        id: 5,
        type: "In-App Alerts",
        title: "Price Alert",
        message: "Price Alert",
        time: "10:30am",
        action: "",
        description: "Bitcoin (BTC) is down -5.98% in the last 24 hours",
        priceChange: "-5.98%",
        isNegative: true
      }
    ]
  });

  const tabs = ["All", "News", "In-App Alerts"];

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationPanel && 
          notificationRef.current && 
          !notificationRef.current.contains(event.target)) {
        setShowNotificationPanel(false);
      }
    };

    // Add event listener when panel is open
    if (showNotificationPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotificationPanel, setShowNotificationPanel]);

  const getFilteredNotifications = () => {
    return notifications[activeTab] || [];
  };

  const clearNotifications = () => {
    if (activeTab === "All") {
      // Clear all notifications from all sections
      setNotifications({
        All: [],
        News: [],
        "In-App Alerts": []
      });
    } else {
      // Clear only the specific tab, don't affect other sections
      setNotifications(prev => ({
        ...prev,
        [activeTab]: []
      }));
    }
  };

  const EmptyState = () => (
    <div className="bg-[#181818] rounded-2xl p-8 text-center flex-1 flex flex-col justify-center items-center lg:min-h-[400px]">
      <div className="mb-6">
        <div className="w-25 h-25 rounded-full flex items-center justify-center mx-auto mb-4">
          <img src={bell} alt="" className="" />
        </div>
        <h3 className="text-white font-semibold text-xl mb-3">All Clear!</h3>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
          There are no new notifications for now. Check back later for updates or feel free to check other topics.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Gradient Overlay */}
      {showNotificationPanel && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 rounded-2xl transition-opacity duration-300"
          onClick={() => setShowNotificationPanel(false)}
        />
      )}

      <div
        className={`notification-panel rounded-2xl fixed top-0 right-0 w-full h-full md:w-[30rem] md:top-[88px] md:h-[calc(100vh-88px-48px)] z-50 transform transition-transform duration-300 ease-in-out ${
          showNotificationPanel ? "translate-x-0 md:-translate-x-5" : "translate-x-full"
        }`} 
        ref={notificationRef}
      >
        {/* Full height background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-black to-black/95 md:bg-transparent rounded-2xl" />
        
        <div className="relative flex flex-col w-full h-full">
          <style jsx>{`
            /* Custom scrollbar styles for the notification panel */
            .notification-scrollable::-webkit-scrollbar {
              width: 8px !important;
              height: 8px !important;
            }

            .notification-scrollable::-webkit-scrollbar-track {
              background: #1f1f1f !important;
              border-radius: 4px !important;
            }

            .notification-scrollable::-webkit-scrollbar-thumb {
              background: #555 !important;
              border-radius: 4px !important;
            }

            .notification-scrollable::-webkit-scrollbar-thumb:hover {
              background: #666 !important;
            }

            .notification-scrollable::-webkit-scrollbar-corner {
              background: #1f1f1f !important;
            }

            /* Firefox */
            .notification-scrollable {
              scrollbar-width: thin !important;
              scrollbar-color: #555 #1f1f1f !important;
            }
          `}</style>
          
          <div className="bg-[#181818] mb-2 mt-1 lg:mt-8 rounded-2xl">
            {/* Header */}
            <div className="flex bg-[#181818] rounded-2xl justify-between items-center p-4">
              <h2 className="text-white font-semibold text-lg">Notifications</h2>
              <div className="flex items-center gap-2">
                {isAuthenticated && getFilteredNotifications().length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-2 hover:bg-red-500/20 rounded-full transition-colors group"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationPanel(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 px-4 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List - Scrollable Content */}
          <div className="flex-1 overflow-y-auto notification-scrollable px-2 pb-4">
            {!isAuthenticated ? (
              <div className="bg-[#181818] rounded-md p-8 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Sign In Required</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Please sign in to view your notifications and stay updated with the latest activities.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-70 transition-colors">
                      Sign In
                    </button>
                    <button className="px-6 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-[#181818] rounded-md p-4 hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* <span className="text-xs text-primary font-medium">
                          {notification.type}
                        </span> */}
                        {/* <span className="text-xs text-gray-400">
                          {notification.title}
                        </span> */}

                    
                      </div>
                  
                    </div>

                    <div className="mb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div>


                                   {notification.hasImage && (
                            <div className=" bg-blue-600 rounded flex items-center justify-center mr-2">
                              <img src={Gen} alt="" className="" />
                            </div>
                          )}




                            </div>


                            <div className="flex flex-col">


          
                  <div className="flex gap-2">
                            <h4 className="text-white font-medium text-sm">
                            {notification.message}
                          </h4>
                          <img src={Ellipse} className="text-white font-medium text-sm" alt="" />
                          <span className="text-white font-medium text-sm">
                            {notification.time}
                          </span>
                          {notification.priceChange && (
                            <span className={`text-sm font-medium ml-2 ${
                              notification.isNegative ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {notification.priceChange}
                            </span>
                          )}
                    
                  </div>


                              
                      <div className="flex flex-col items-start text-gray-300 text-xs leading-relaxed">
                        <div className="flex items-center gap-2">
                          {notification.type === "In-App Alerts" && notification.priceChange && (
                            <img 
                              src={notification.isNegative ? RedLine : GreenLine} 
                              alt="" 
                              className=""
                            />
                          )}
                          {notification.description}
                        </div>

                              {notification.action && (
                            <button className="text-sm font-medium text-[rgba(220,208,255,1)] transition-colors">
                              {notification.action}
                            </button>
                          )}
                      </div>



                            </div>
             
                        </div>
             
                    </div>

                
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notification;