import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';

export default function HotScreen() {
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHotTopics();
  }, []);

  const fetchHotTopics = async () => {
    try {
      const data = await api.getHotTopics();
      setHotTopics(data);
    } catch (error) {
      console.error('Error fetching hot topics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHotTopics();
  };

  const getTrendingIcon = (index: number) => {
    if (index === 0) return '🔥';
    if (index === 1) return '⚡';
    if (index === 2) return '🚀';
    return '💬';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="flame" size={28} color="#FF1493" />
          <Text style={styles.headerTitle}>Hot Right Now</Text>
        </View>
        <Text style={styles.headerSubtitle}>See what people are talking about</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {hotTopics.length > 0 ? (
          hotTopics.map((item, index) => (
            <TouchableOpacity key={index} style={styles.topicCard}>
              <LinearGradient
                colors={
                  index === 0
                    ? ['#FF6B6B', '#FF1493']
                    : index === 1
                    ? ['#FF8C00', '#FF6B6B']
                    : ['#f5f5f5', '#f5f5f5']
                }
                style={styles.topicGradient}
              >
                <View style={styles.topicContent}>
                  <Text style={styles.trendingIcon}>{getTrendingIcon(index)}</Text>
                  <View style={styles.topicInfo}>
                    <Text
                      style={[
                        styles.topicName,
                        index < 2 && styles.topicNameLight,
                      ]}
                    >
                      {item.topic}
                    </Text>
                    <Text
                      style={[
                        styles.topicCount,
                        index < 2 && styles.topicCountLight,
                      ]}
                    >
                      {item.count} people talking
                    </Text>
                  </View>
                  <View style={styles.rankBadge}>
                    <Text
                      style={[
                        styles.rankText,
                        index < 2 && styles.rankTextLight,
                      ]}
                    >
                      #{index + 1}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="flame-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Hot Topics Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start conversations to see trending topics here!
            </Text>
          </View>
        )}

        {/* Default trending topics */}
        {hotTopics.length === 0 && (
          <View style={styles.defaultTopics}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            {[
              { name: 'Mental Health', icon: 'brain', color: '#9C27B0' },
              { name: 'Relationships', icon: 'heart', color: '#E91E63' },
              { name: 'Gaming', icon: 'game-controller', color: '#4CAF50' },
              { name: 'Music', icon: 'musical-notes', color: '#2196F3' },
              { name: 'Random Chat', icon: 'chatbubbles', color: '#FF9800' },
            ].map((topic, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${topic.color}20` },
                  ]}
                >
                  <Ionicons name={topic.icon as any} size={24} color={topic.color} />
                </View>
                <Text style={styles.categoryName}>{topic.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 38,
  },
  scrollContent: {
    padding: 16,
  },
  topicCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  topicGradient: {
    padding: 16,
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  topicNameLight: {
    color: '#fff',
  },
  topicCount: {
    fontSize: 13,
    color: '#666',
  },
  topicCountLight: {
    color: 'rgba(255,255,255,0.9)',
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  rankTextLight: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  defaultTopics: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
