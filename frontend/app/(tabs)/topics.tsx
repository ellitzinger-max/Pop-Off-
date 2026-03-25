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
import { api } from '../../src/services/api';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Mental Health': '#9C27B0',
  'Relationships': '#E91E63',
  'Life & Career': '#2196F3',
  'Hobbies': '#4CAF50',
  'Current Events': '#FF9800',
  'Just Vibing': '#00BCD4',
};

export default function TopicsScreen() {
  const [categories, setCategories] = useState<{ [key: string]: any[] }>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const data = await api.getTopicCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopics();
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={28} color="#FF1493" />
          <Text style={styles.headerTitle}>Topics</Text>
        </View>
        <Text style={styles.headerSubtitle}>Find conversations that matter to you</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(categories).map(([category, topics]) => (
          <View key={category} style={styles.categorySection}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: `${CATEGORY_COLORS[category] || '#999'}20` },
                ]}
              >
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={24}
                  color={CATEGORY_COLORS[category] || '#999'}
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryCount}>{topics.length} topics</Text>
              </View>
              <Ionicons
                name={expandedCategory === category ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>

            {expandedCategory === category && (
              <View style={styles.topicsGrid}>
                {topics.map((topic, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.topicChip,
                      { borderColor: CATEGORY_COLORS[category] || '#999' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.topicText,
                        { color: CATEGORY_COLORS[category] || '#999' },
                      ]}
                    >
                      {topic.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Empty State */}
        {Object.keys(categories).length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Topics Found</Text>
            <Text style={styles.emptySubtitle}>Check back later for new topics!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getCategoryIcon(category: string): any {
  const icons: { [key: string]: string } = {
    'Mental Health': 'heart-half',
    'Relationships': 'heart',
    'Life & Career': 'briefcase',
    'Hobbies': 'game-controller',
    'Current Events': 'newspaper',
    'Just Vibing': 'happy',
  };
  return icons[category] || 'chatbubble';
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
  categorySection: {
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 13,
    color: '#666',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
});
