import React from 'react';

export default function PremiumModal({ open, onClose, onUpgrade, isPremium }) {
  if (!open) return null;
  const features = [
    'Unlimited Smart Shuffle queue',
    'Unlimited songs per playlist',
    'Premium badge & themes',
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#181a20] border border-blue-600 rounded-lg p-8 w-full max-w-md mx-4 relative shadow-2xl flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl"
        >
          ×
        </button>
        <div className="text-center w-full">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl text-white">★</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{isPremium ? 'You are Premium!' : 'Upgrade to Premium'}</h2>
          <div className="bg-blue-900/20 rounded-lg p-4 mb-6 text-white w-full">
            <h3 className="font-semibold mb-3">Premium Features:</h3>
            <ul className="text-sm space-y-2 text-left">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <span className="text-blue-300 mr-2 text-lg">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          {!isPremium ? (
            <button
              onClick={onUpgrade}
              className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg mb-2"
            >
              Upgrade Now (Free Trial)
            </button>
          ) : (
            <div className="text-blue-400 font-semibold text-lg mb-2">Thank you for being a Premium member!</div>
          )}
          <p className="text-xs text-white/80 mt-2">
            30-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
} 