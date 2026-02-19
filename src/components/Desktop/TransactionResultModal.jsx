/**
 * TransactionResultModal - Reusable success/failure modal for transaction feedback
 */
import { X, CheckCircle, AlertCircle } from "lucide-react";
import succes from "../../assets/succes12.png";

const TransactionResultModal = ({
    isOpen,
    onClose,
    type = 'success',
    title,
    message,
    onConfirm
}) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10005] flex items-center justify-center">
            <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-md shadow-2xl mx-4">
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                        {title || (isSuccess ? 'Successfully Uploaded' : 'Error')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    {isSuccess ? (
                        <div className="w-24 h-24 rounded-full flex items-center justify-center">
<img src={succes} alt="" />                        
</div>
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                    )}
                </div>

                {/* Message */}
                <div className="text-center mb-6">
                    <p className={`text-sm ${isSuccess ? 'text-gray-300' : 'text-red-400'}`}>
                        {message || (isSuccess
                            ? 'Your account has been listed successfully! You can now add another account.'
                            : 'An error occurred. Please try again.'
                        )}
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-center">
                    <button
                        onClick={onConfirm || onClose}
                        className={`px-8 py-3 rounded-full font-semibold transition-colors ${isSuccess
                                ? 'bg-[#613cd0] hover:bg-[#7050d5] text-white'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                            }`}
                    >
                        {isSuccess ? 'Continue' : 'Try Again'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionResultModal;
