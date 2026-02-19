import { X, Star, Info, LogOut, HelpCircle } from "lucide-react";
import { useState } from "react";
import manageLogo from "../../assets/manageLogo.svg";
import UploadSocialAccount from "../../components/Desktop/UploadSocialAccount";
import ManageListedAccounts from "../../components/Desktop/ManageListedAccount";
import UploadAccountRequest from "../../components/Desktop/UploadAccountListed";
import ManageAccountRequests from "../../components/Desktop/ManageAccountRequest";

const ManageAccountModal = ({ isOpen, onClose }) => {
  const [activeModal, setActiveModal] = useState(null);

  if (!isOpen) return null;

  const handleModalOpen = (modalType) => {
    setActiveModal(modalType);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 z-[9999] rounded-md flex items-center justify-center lg:p-4 overflow-y-auto">
      <div className="bg-[#0D0D0D] rounded-lg p-4 lg:p-6 w-full max-w-xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full flex items-end justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 justify-center items-center mb-4">
          <h2 className="text-white text-lg text-center font-semibold">
            Manage Accounts
          </h2>
          <img src={manageLogo} alt="" />
        </div>

        <div className="mt-6">
          <div className="text-sm mb-4">
            <h2 className="mb-1">Manage Your Social Accounts</h2>
            <p className="text-regular3">
              Upload, track, and manage your listed social media accounts
              seamlessly on Soctral
            </p>
          </div>

          <div className="bg-[#1D1D1D] rounded-lg p-5">
            <div className="flex flex-col gap-3 text-sm mb-5">
              <h3 className="text-[#948f9e] tracking-widest text-md font-bold">
                Upload Social Account
              </h3>

              <p>
                Easily list your social media accounts for sale by providing the
                necessary details. Reach potential buyers and start trading
                securely on Soctral.
              </p>

              <button 
                onClick={() => handleModalOpen('upload')}
                className="text-sm w-fit py-3 px-8 rounded-full bg-[#dcd0ff] text-primary font-semibold hover:bg-[#dcd0ff]/80"
              >
                Upload
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm mb-5">
              <h3 className="text-[#948f9e] tracking-widest text-md font-bold">
                Manage Listed Accounts
              </h3>

              <p>
                Keep track of your uploaded accounts and update account details
                - all in one place for a smooth trading experience.
              </p>

              <button 
                onClick={() => handleModalOpen('manage')}
                className="text-sm w-fit py-3 px-8 rounded-full bg-[#dcd0ff] text-primary font-semibold hover:bg-[#dcd0ff]/80"
              >
                Manage
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm mb-5">
              <h3 className="text-[#948f9e] tracking-widest text-md font-bold">
                Upload Account Request
              </h3>

              <p>
                Looking for a specific social media account? Post your request
                here, and sellers with matching accounts can reach out to you
                for a trade.
              </p>

              <button 
                onClick={() => handleModalOpen('uploadRequest')}
                className="text-sm w-fit py-3 px-8 rounded-full bg-[#dcd0ff] text-primary font-semibold hover:bg-[#dcd0ff]/80"
              >
                Upload
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm mb-5">
              <h3 className="text-[#948f9e] tracking-widest text-md font-bold">
                Manage Account Requests
              </h3>

              <p>
                Keep track of the social media accounts you're looking to
                purchase. View, edit, or remove your account requests to help
                sellers find and initiate trades with you easily.
              </p>

              <button 
                onClick={() => handleModalOpen('manageRequests')}
                className="text-sm w-fit py-3 px-8 rounded-full bg-[#dcd0ff] text-primary font-semibold hover:bg-[#dcd0ff]/80"
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Individual Modal Components */}
      <UploadSocialAccount 
        isOpen={activeModal === 'upload'} 
        onClose={handleModalClose} 
      />
      <ManageListedAccounts 
        isOpen={activeModal === 'manage'} 
        onClose={handleModalClose} 
      />
      <UploadAccountRequest 
        isOpen={activeModal === 'uploadRequest'} 
        onClose={handleModalClose} 
      />
      <ManageAccountRequests 
        isOpen={activeModal === 'manageRequests'} 
        onClose={handleModalClose} 
      />
    </div>
  );
};

export default ManageAccountModal;