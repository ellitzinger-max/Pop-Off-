import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/services/api';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (session_id) {
      pollPaymentStatus();
    } else {
      setStatus('failed');
      setMessage('No session ID found');
    }
  }, [session_id]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('failed');
      setMessage('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const result = await api.getCheckoutStatus(session_id!);
      
      if (result.payment_status === 'paid') {
        setStatus('success');
        setMessage('Your purchase has been completed successfully!');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.replace('/premium');
        }, 3000);
        return;
      } else if (result.status === 'expired') {
        setStatus('failed');
        setMessage('Payment session expired. Please try again.');
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    } catch (error) {
      console.error('Status check error:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    }
  };

  return (
    <LinearGradient
      colors={status === 'success' ? ['#4CAF50', '#2E7D32'] : status === 'failed' ? ['#f44336', '#c62828'] : ['#FF6B6B', '#FF1493']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {status === 'loading' ? (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.title}>Processing Payment...</Text>
              <Text style={styles.subtitle}>Please wait while we verify your payment</Text>
            </>
          ) : status === 'success' ? (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#fff" />
              </View>
              <Text style={styles.title}>Payment Successful!</Text>
              <Text style={styles.subtitle}>{message}</Text>
              <Text style={styles.redirectText}>Redirecting to premium page...</Text>
            </>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="close-circle" size={80} color="#fff" />
              </View>
              <Text style={styles.title}>Payment Failed</Text>
              <Text style={styles.subtitle}>{message}</Text>
            </>
          )}
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  redirectText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 24,
  },
});
