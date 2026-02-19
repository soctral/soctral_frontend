import { X, Star, Info, LogOut, HelpCircle } from "lucide-react";
import chat from "../../assets/chat.svg";
import email from "../../assets/email.svg";

const SupportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 z-[9999] rounded-md flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl">
        <div className="w-full flex items-end justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center items-center mb-4">
          <h2 className="text-white text-lg text-center font-semibold">
            Help Center & Support
          </h2>
        </div>

        <div>
          <div className="">
            <h2 className="font-bold text-sm"> chat </h2>
            <div className="bg-[#181818] p-3 rounded-md">
              <p className="text-[#948f9e] bg-[#603CD033] p-2 w-fit rounded-full text-sm">
                Avg. Response Time<span className="text-white"> 1 min</span>
              </p>

              <div 
                className="flex items-center gap-2 pt-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors"
                onClick={() => {
                  // Open Zendesk chat widget
                  if (window.zE) {
                    window.zE('messenger', 'open');
                  } else {
                    window.open('https://soctraltechnologyhelp.zendesk.com', '_blank');
                  }
                  onClose();
                }}
              >
                <img src={chat} alt="" />
                <div className="text-sm ">
                  <h3 className="text-white">Live Web Chat</h3>

                  <p className="text-[#948f9e]">
                    Start a Conversation on Live Chat
                  </p>
                </div>
              </div>
            </div>
          </div>



            <div className="pt-3">
            <h2 className="font-bold text-sm"> Email </h2>
            <div className="bg-[#181818] p-3 rounded-md">
              <p className="text-[#948f9e] bg-[#603CD033] p-2 w-fit rounded-full text-sm">
                Avg. Response Time<span className="text-white"> 12 hrs</span>
              </p>

              <div className="flex items-center gap-2 pt-3">
                <img src={chat} alt="" />
                <div className="text-sm ">
                  <h3 className="text-white">Support@Soctralapp.com</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
