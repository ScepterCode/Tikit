export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export const shareTicket = async (options: ShareOptions): Promise<boolean> => {
  try {
    if (navigator.share) {
      await navigator.share(options);
      return true;
    } else {
      // Fallback for browsers without Web Share API
      const shareText = `${options.title}\n${options.text}${options.url ? `\n${options.url}` : ''}`;
      await navigator.clipboard.writeText(shareText);
      return true;
    }
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
};

export const shareViaWhatsApp = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};