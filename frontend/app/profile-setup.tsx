import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/contexts/AuthContext';

const TOPICS_DATA = {
  'Mental Health': ['Anxiety', 'Depression', 'Stress', 'Self-Care', 'Therapy', 'Mindfulness'],
  'Relationships': ['Dating', 'Friendship', 'Family', 'Breakups', 'Marriage', 'LGBTQ+'],
  'Life & Career': ['Career Advice', 'School', 'Finances', 'Life Changes', 'Goals', 'Motivation'],
  'Hobbies': ['Gaming', 'Music', 'Movies', 'Sports', 'Art', 'Travel', 'Food', 'Fitness'],
  'Current Events': ['Politics', 'News', 'Social Issues', 'Technology', 'Environment'],
  'Just Vibing': ['Random Chat', 'Making Friends', 'Night Owls', 'Vent Session', 'Good Vibes Only'],
};

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1 data
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [age, setAge] = useState('');
  
  // Step 2 data
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < 10) {
      setSelectedInterests([...selectedInterests, interest]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 10 interests');
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      // Save profile
      setLoading(true);
      try {
        await updateUser({
          bio,
          city,
          state,
          age: age ? parseInt(age) : undefined,
          profile_photo: profilePhoto,
          interests: selectedInterests,
          profile_complete: true,
        });
        router.replace('/(tabs)/pop-off');
      } catch (error) {
        Alert.alert('Error', 'Failed to save profile');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setStep(2);
    } else {
      handleNextStep();
    }
  };

  const progress = step === 1 ? 50 : 100;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>Step {step} of 2</Text>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#FF6B6B', '#FF1493']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            // Step 1: Profile Info
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={32} color="#FF1493" />
              </View>
              <Text style={styles.title}>Let's Set Up Your Profile</Text>
              <Text style={styles.subtitle}>Add a photo and tell us about yourself</Text>

              {/* Photo Upload */}
              <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoInitial}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.photoEditButton}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Click to upload a photo</Text>

              {/* Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>About You</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell others what you're about... What brings you here? What do you love to talk about?"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={bio}
                  onChangeText={setBio}
                  maxLength={300}
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location" size={16} color="#FF1493" />
                  <Text style={styles.label}>Location (Optional)</Text>
                </View>
                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="City"
                    placeholderTextColor="#999"
                    value={city}
                    onChangeText={setCity}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="State"
                    placeholderTextColor="#999"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
              </View>

              {/* Age */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.ageInput]}
                  placeholder="25"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={setAge}
                  maxLength={2}
                />
              </View>
            </View>
          ) : (
            // Step 2: Interests
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={32} color="#FF1493" />
              </View>
              <Text style={styles.title}>What Are You Into?</Text>
              <Text style={styles.subtitle}>Select topics you want to Pop Off! about</Text>

              {Object.entries(TOPICS_DATA).map(([category, topics]) => (
                <View key={category} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                  <View style={styles.topicsGrid}>
                    {topics.map((topic) => (
                      <TouchableOpacity
                        key={topic}
                        style={[
                          styles.topicChip,
                          selectedInterests.includes(topic) && styles.topicChipSelected,
                        ]}
                        onPress={() => toggleInterest(topic)}
                      >
                        <Text
                          style={[
                            styles.topicText,
                            selectedInterests.includes(topic) && styles.topicTextSelected,
                          ]}
                        >
                          {topic}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Selected Counter */}
              <View style={styles.selectedCounter}>
                <Text style={styles.selectedText}>
                  Selected: <Text style={styles.selectedCount}>{selectedInterests.length}/10 interests</Text>
                </Text>
                {selectedInterests.length > 0 && (
                  <Text style={styles.selectedList}>
                    {selectedInterests.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF1493']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextText}>
                    {step === 1 ? 'Next' : 'Start Popping Off!'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepText: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#FF1493',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 20, 147, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoHint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  ageInput: {
    width: 80,
  },
  categoryContainer: {
    width: '100%',
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 12,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  topicChipSelected: {
    backgroundColor: '#FF1493',
    borderColor: '#FF1493',
  },
  topicText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  topicTextSelected: {
    color: '#fff',
  },
  selectedCounter: {
    width: '100%',
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  selectedText: {
    fontSize: 14,
    color: '#FF1493',
  },
  selectedCount: {
    fontWeight: '700',
  },
  selectedList: {
    fontSize: 13,
    color: '#FF69B4',
    marginTop: 8,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
