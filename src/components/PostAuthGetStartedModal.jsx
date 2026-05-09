import React from "react";
import { Upload, Search, X } from "lucide-react";

const PostAuthGetStartedModal = ({ isOpen, onClose, onListAccount, onRequestAccount }) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0D0D0D] border border-white/10 shadow-2xl p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>

          <div className="pr-10">
            <h3 className="text-white text-lg font-semibold">What do you want to do first?</h3>
            <p className="text-gray-400 text-sm mt-1">
              You can list an account for sale, or post what you’re looking for. You can also skip this for now.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={onListAccount}
              className="w-full flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors px-4 py-3 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">List an account for sale</div>
                <div className="text-gray-400 text-xs">Upload details and start selling securely.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={onRequestAccount}
              className="w-full flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors px-4 py-3 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">Request an account</div>
                <div className="text-gray-400 text-xs">Post what you want; sellers can reach out.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostAuthGetStartedModal;

