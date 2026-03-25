import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

const QUICK_PICKS = [
  { emoji: '😤', text: 'I need to vent about something' },
  { emoji: '💬', text: 'Looking for advice on a situation' },
  { emoji: '🤔', text: "Want someone's perspective" },
  { emoji: '😊', text: 'Just want to chat and meet people' },
  { emoji: '💔', text: 'Going through a tough time' },
  { emoji: '🎉', text: 'Want to share some good news' },
  { emoji: '🌙', text: "Can't sleep, need company" },
  { emoji: '🔥', text: 'Want to debate/discuss hot topics' },
];

export default function PopOffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matchFound, setMatchFound] = useState<any>(null);

  const handleQuickPick = (text: string) => {
    setSelectedMood(text);
    setCustomMessage(text);
  };

  const handlePopOff = async () => {
    if (!customMessage.trim()) {
      Alert.alert('Hey!', 'Tell us what you want to talk about!');
      return;
    }

    setLoading(true);
    setSearching(true);

    try {
      const result = await api.startMatching(
        selectedMood || 'General',
        customMessage,
        user?.interests || []
      );

      if (result.status === 'matched' && result.channel_name) {
        setMatchFound(result);
      } else {
        // Keep checking for match
        checkForMatch();
      }
    } catch (error) {
      console.error('Match error:', error);
      Alert.alert('Error', 'Failed to start matching. Please try again.');
      setSearching(false);
    } finally {
      setLoading(false);
    }
  };

  const checkForMatch = async () => {
    const checkInterval = setInterval(async () => {
      try {
        const status = await api.getMatchStatus();
        if (status.status === 'matched' && status.channel_name) {
          clearInterval(checkInterval);
          setMatchFound(status);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 2000);

    // Stop checking after 60 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!matchFound) {
        setSearching(false);
        Alert.alert(
          'No Match Found',
          'No one is available right now. Try again later!',
          [{ text: 'OK' }]
        );
        api.cancelMatch();
      }
    }, 60000);
  };

  const handleCancelSearch = async () => {
    try {
      await api.cancelMatch();
    } catch (error) {
      console.error('Cancel error:', error);
    }
    setSearching(false);
    setMatchFound(null);
  };

  const handleJoinCall = async () => {
    if (matchFound?.channel_name) {
      router.push({
        pathname: '/video-call',
        params: { channel: matchFound.channel_name },
      });
      setSearching(false);
      setMatchFound(null);
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B6B', '#FF1493', '#FF8C00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="flash" size={32} color="#fff" />
            </View>
            <Text style={styles.title}>What Do You Want to Pop Off! About?</Text>
            <Text style={styles.subtitle}>
              Tell us what's on your mind and we'll match you with someone who gets it
            </Text>
          </View>

          {/* Quick Picks */}
          <View style={styles.quickPicksContainer}>
            <Text style={styles.quickPicksTitle}>Quick picks:</Text>
            <View style={styles.quickPicksGrid}>
              {QUICK_PICKS.map((pick, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickPickButton,
                    selectedMood === pick.text && styles.quickPickSelected,
                  ]}
                  onPress={() => handleQuickPick(pick.text)}
                >
                  <Text style={styles.quickPickEmoji}>{pick.emoji}</Text>
                  <Text
                    style={[
                      styles.quickPickText,
                      selectedMood === pick.text && styles.quickPickTextSelected,
                    ]}
                  >
                    {pick.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Message */}
          <View style={styles.customMessageContainer}>
            <Text style={styles.orText}>Or tell us in your words:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What's going on? What do you want to talk about? What's bugging you?"
              placeholderTextColor="rgba(255,255,255,0.6)"
              multiline
              numberOfLines={4}
              value={customMessage}
              onChangeText={setCustomMessage}
              maxLength={500}
            />
            <Text style={styles.charCount}>{customMessage.length}/500 characters</Text>
          </View>

          {/* Pop Off Button */}
          <TouchableOpacity
            style={styles.popOffButton}
            onPress={handlePopOff}
            disabled={loading || searching}
          >
            {loading ? (
              <ActivityIndicator color="#FF1493" size="large" />
            ) : (
              <>
                <Ionicons name="flash" size={28} color="#FF1493" />
                <Text style={styles.popOffText}>Pop Off!</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>Matched with similar vibes</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="videocam" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>Video chat when ready</Text>
            </View>
          </View>
        </ScrollView>

        {/* Searching Modal */}
        <Modal visible={searching} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {matchFound ? (
                <>
                  <View style={styles.matchFoundIcon}>
                    <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                  </View>
                  <Text style={styles.modalTitle}>Match Found!</Text>
                  <Text style={styles.modalSubtitle}>
                    Someone wants to talk about similar things
                  </Text>
                  <TouchableOpacity style={styles.joinButton} onPress={handleJoinCall}>
                    <Ionicons name="videocam" size={24} color="#fff" />
                    <Text style={styles.joinButtonText}>Join Video Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelSearchButton}
                    onPress={handleCancelSearch}
                  >
                    <Text style={styles.cancelSearchText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ActivityIndicator size="large" color="#FF1493" />
                  <Text style={styles.modalTitle}>Looking for a match...</Text>
                  <Text style={styles.modalSubtitle}>
                    We're finding someone who wants to talk about similar things
                  </Text>
                  <TouchableOpacity
                    style={styles.cancelSearchButton}
                    onPress={handleCancelSearch}
                  >
                    <Text style={styles.cancelSearchText}>Cancel Search</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickPicksContainer: {
    marginBottom: 20,
  },
  quickPicksTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  quickPicksGrid: {
    gap: 8,
  },
  quickPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 10,
  },
  quickPickSelected: {
    backgroundColor: '#fff',
  },
  quickPickEmoji: {
    fontSize: 18,
  },
  quickPickText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  quickPickTextSelected: {
    color: '#333',
  },
  customMessageContainer: {
    marginBottom: 24,
  },
  orText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 8,
  },
  popOffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  popOffText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF1493',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
  },
  infoItem: {
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  matchFoundIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cancelSearchButton: {
    paddingVertical: 12,
  },
  cancelSearchText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
});
