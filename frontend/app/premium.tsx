import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';

const MEMBERSHIP_FEATURES = [
  { icon: 'rocket', text: 'Priority visibility in matching queue' },
  { icon: 'flash', text: '3 daily boosts included' },
  { icon: 'document-text', text: '5 posts per day (vs 1 for free)' },
  { icon: 'star', text: 'Premium badge on profile' },
  { icon: 'shield-checkmark', text: 'Priority support' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [membership, setMembership] = useState<any>(null);
  const [packages, setPackages] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch packages first (doesn't require auth)
      const packagesData = await api.getPackages();
      setPackages(packagesData);
      
      // Try to get membership status (requires auth)
      try {
        const membershipData = await api.getMembershipStatus();
        setMembership(membershipData);
      } catch (authError) {
        // If not logged in, use default free membership status
        console.log('Using default membership status (not logged in)');
        setMembership({
          is_premium: false,
          boosts_remaining: 0,
          posts_remaining: 1,
          daily_posts_used: 0,
          daily_limit: 1,
          extra_posts_remaining: 0,
          priority_visibility: false,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string, packageType: string) => {
    setPurchasing(`${packageType}_${packageId}`);
    try {
      // Get origin URL for success/cancel redirects
      const originUrl = Platform.OS === 'web' 
        ? window.location.origin 
        : 'https://mobile-popoff-build.preview.emergentagent.com';

      const result = await api.createCheckout(packageId, packageType, originUrl);
      
      if (result.checkout_url) {
        // Open Stripe checkout
        if (Platform.OS === 'web') {
          window.location.href = result.checkout_url;
        } else {
          await Linking.openURL(result.checkout_url);
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to start checkout');
    } finally {
      setPurchasing(null);
    }
  };

  const handleUseBoost = async () => {
    if (!membership || membership.boosts_remaining <= 0) {
      Alert.alert('No Boosts', 'Purchase more boosts to increase your visibility!');
      return;
    }

    try {
      const result = await api.useBoost();
      Alert.alert('Boost Activated!', 'Your profile will be more visible for the next hour!');
      setMembership({ ...membership, boosts_remaining: result.boosts_remaining });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to use boost');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={membership?.is_premium ? ['#FFD700', '#FFA500'] : ['#f5f5f5', '#e8e8e8']}
            style={styles.statusGradient}
          >
            <Ionicons 
              name={membership?.is_premium ? 'star' : 'star-outline'} 
              size={40} 
              color={membership?.is_premium ? '#fff' : '#999'} 
            />
            <Text style={[styles.statusTitle, membership?.is_premium && styles.statusTitlePremium]}>
              {membership?.is_premium ? 'Premium Member' : 'Free Member'}
            </Text>
            {membership?.is_premium && membership?.premium_until && (
              <Text style={styles.statusExpiry}>
                Expires: {new Date(membership.premium_until).toLocaleDateString()}
              </Text>
            )}
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{membership?.boosts_remaining || 0}</Text>
              <Text style={styles.statLabel}>Boosts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{membership?.posts_remaining || 0}</Text>
              <Text style={styles.statLabel}>Posts Left</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{membership?.daily_limit || 1}/day</Text>
              <Text style={styles.statLabel}>Post Limit</Text>
            </View>
          </View>

          {membership?.boosts_remaining > 0 && (
            <TouchableOpacity style={styles.useBoostButton} onPress={handleUseBoost}>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.useBoostText}>Use a Boost Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Premium Membership */}
        {!membership?.is_premium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Go Premium</Text>
            <View style={styles.premiumCard}>
              <LinearGradient
                colors={['#FF6B6B', '#FF1493']}
                style={styles.premiumHeader}
              >
                <Ionicons name="diamond" size={32} color="#fff" />
                <Text style={styles.premiumTitle}>Premium Membership</Text>
                <View style={styles.priceTag}>
                  <Text style={styles.priceAmount}>$10</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </LinearGradient>

              <View style={styles.featuresContainer}>
                {MEMBERSHIP_FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name={feature.icon as any} size={20} color="#FF1493" />
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={() => handlePurchase('premium_monthly', 'membership')}
                disabled={purchasing === 'membership_premium_monthly'}
              >
                {purchasing === 'membership_premium_monthly' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Boost Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boost Bundles</Text>
          <Text style={styles.sectionSubtitle}>
            Get more matches with visibility boosts
          </Text>

          <View style={styles.packagesGrid}>
            {packages?.boosts && Object.entries(packages.boosts).map(([id, pkg]: [string, any]) => (
              <TouchableOpacity
                key={id}
                style={styles.packageCard}
                onPress={() => handlePurchase(id, 'boosts')}
                disabled={purchasing === `boosts_${id}`}
              >
                <View style={styles.packageIconContainer}>
                  <Ionicons name="flash" size={24} color="#FF8C00" />
                </View>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packagePrice}>${pkg.price.toFixed(2)}</Text>
                {purchasing === `boosts_${id}` && (
                  <ActivityIndicator style={styles.packageLoader} size="small" color="#FF1493" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Post Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extra Posts</Text>
          <Text style={styles.sectionSubtitle}>
            Need more posts? Get extra allowances
          </Text>

          <View style={styles.packagesGrid}>
            {packages?.posts && Object.entries(packages.posts).map(([id, pkg]: [string, any]) => (
              <TouchableOpacity
                key={id}
                style={styles.packageCard}
                onPress={() => handlePurchase(id, 'posts')}
                disabled={purchasing === `posts_${id}`}
              >
                <View style={[styles.packageIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="document-text" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packagePrice}>${pkg.price.toFixed(2)}</Text>
                {purchasing === `posts_${id}` && (
                  <ActivityIndicator style={styles.packageLoader} size="small" color="#FF1493" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Payments are processed securely by Stripe.
          </Text>
          <Text style={styles.footerText}>
            Cancel anytime from your account settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statusCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#666',
    marginTop: 8,
  },
  statusTitlePremium: {
    color: '#fff',
  },
  statusExpiry: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF1493',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  useBoostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  useBoostText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  premiumCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  premiumHeader: {
    padding: 24,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  pricePeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  featuresContainer: {
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  purchaseButton: {
    backgroundColor: '#FF1493',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageCard: {
    width: '30%',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  packageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF1493',
  },
  packageLoader: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
