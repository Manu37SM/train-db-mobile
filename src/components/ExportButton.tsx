import React from 'react';
import { Share } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useToastStore } from '@/store/toastStore';
interface ExportButtonProps {
  filename: string;
  csv: string;
  compact?: boolean;
}
export default function ExportButton({ filename, csv, compact = true }: ExportButtonProps) {
  async function handleExport() {
    try {
      await Share.share({
        title: filename.endsWith('.csv') ? filename : `${filename}.csv`,
        message: csv,
      });
    } catch {
      useToastStore.getState().show('Could not open the share sheet.');
    }
  }
  return <IconButton icon="download" size={compact ? 20 : 24} onPress={handleExport} />;
}
