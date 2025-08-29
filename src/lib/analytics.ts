// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Common event tracking functions
export const analytics = {
  // Button click events
  trackButtonClick: (buttonName: string, context?: string) => {
    const label = context ? `${buttonName}_${context}` : buttonName;
  
    // Keep generic button_click
    trackEvent('button_click', 'engagement', label);
  
    // New dynamic event for this specific button
    const buttonEventName = `${buttonName}_clicked`;
    trackEvent(buttonEventName, 'engagement', label);
  },

  // Form interactions
  trackFormSubmission: (formType: string, hasDescription: boolean) => {
    trackEvent('form_submit', 'engagement', formType, 1);
    trackEvent('form_field_usage', 'engagement', 'description', hasDescription ? 1 : 0);
  },

  // Gift generation
  trackGiftGeneration: (recipient: string, occasion: string, vibe: string, budget: string) => {
    trackEvent('gift_generation', 'engagement', 'generate_gifts', 1);
    trackEvent('preferences_used', 'engagement', 'recipient', recipient ? 1 : 0);
    trackEvent('preferences_used', 'engagement', 'occasion', occasion ? 1 : 0);
    trackEvent('preferences_used', 'engagement', 'vibe', vibe ? 1 : 0);
    trackEvent('preferences_used', 'engagement', 'budget', budget ? 1 : 0);
  },

  // Gift feedback
  trackGiftFeedback: (feedback: 'love' | 'like' | 'dislike', gift: string) => {
    trackEvent('gift_feedback', 'engagement', feedback, 1);
    trackEvent('gift_interaction', 'engagement', gift, 1);
  },

  // Copy gift
  trackGiftCopy: (gift: string) => {
    trackEvent('gift_copy', 'engagement', gift, 1);
  },

  // Theme toggle
  trackThemeToggle: (newTheme: string) => {
    trackEvent('theme_change', 'preferences', newTheme, 1);
  },

  // Wishlist interactions
  trackWishlistAction: (action: 'view' | 'add' | 'remove', gift?: string) => {
    trackEvent('wishlist_action', 'engagement', `${action}${gift ? `_${gift}` : ''}`, 1);
  },

  // Voice input
  trackVoiceInput: (action: 'start' | 'stop') => {
    trackEvent('voice_input', 'engagement', action, 1);
  },

  // Page interactions
  trackPageInteraction: (interaction: string, details?: string) => {
    trackEvent('page_interaction', 'engagement', `${interaction}${details ? `_${details}` : ''}`, 1);
  },

  // Error tracking
  trackError: (errorType: string, context?: string) => {
    trackEvent('error', 'error', `${errorType}${context ? `_${context}` : ''}`, 1);
  },

  // Feedback tracking
  trackFeedbackSubmission: (hasText: boolean, selectedOptions: string[], textLength?: number, positiveOptions?: string[], negativeOptions?: string[]) => {
    trackEvent('feedback_submit', 'engagement', 'app_feedback', 1);
    trackEvent('feedback_options_selected', 'engagement', selectedOptions.join(','), selectedOptions.length);
    
    if (positiveOptions && positiveOptions.length > 0) {
      trackEvent('feedback_positive_options', 'engagement', positiveOptions.join(','), positiveOptions.length);
    }
    
    if (negativeOptions && negativeOptions.length > 0) {
      trackEvent('feedback_negative_options', 'engagement', negativeOptions.join(','), negativeOptions.length);
    }
    
    if (hasText && textLength) {
      trackEvent('feedback_text_length', 'engagement', 'text_feedback', textLength);
    }
  },

  // Feedback modal interactions
  trackFeedbackModal: (action: 'open' | 'close') => {
    trackEvent('feedback_modal', 'engagement', action, 1);
  }
};