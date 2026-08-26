import React from 'react';
import { Share } from 'react-native';
import { IconButton } from 'react-native-paper';
import { WEB_BASE_URL } from '@/config/env';
import { useToastStore } from '@/store/toastStore';
interface ShareButtonProps {
  title: string;
  text: string;
  path: string;
}
export default function ShareButton({ title, text, path }: ShareButtonProps) {
  async function handleShare() {
    const url = `${WEB_BASE_URL}${path}`;
    try {
      await Share.share({
        title,
        message: `${text} ${url}`,
        url,
      });
    } catch {
      useToastStore.getState().show('Could not open the share sheet.');
    }
  }
  return <IconButton icon="share-variant-outline" size={20} onPress={handleShare} />;
}
