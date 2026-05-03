import React from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/Auth/LoginScreen';

// Listening
import ListeningListScreen from '../screens/Listening/ListeningListScreen';
import ListeningDetailScreen from '../screens/Listening/ListeningDetailScreen';
import ListeningResultScreen from '../screens/Listening/ListeningResultScreen';

// Writing
import WritingScreen from '../screens/Writing/WritingScreen';
import WritingResultScreen from '../screens/Writing/WritingResultScreen';

// Speaking
import SpeakingScreen from '../screens/Speaking/SpeakingScreen';
import SpeakingResultScreen from '../screens/Speaking/SpeakingResultScreen';

// History
import HistoryScreen from '../screens/History/HistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Listening Stack ───────────────────────────────────────
function ListeningStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListeningList" component={ListeningListScreen} />
      <Stack.Screen name="ListeningDetail" component={ListeningDetailScreen} />
      <Stack.Screen name="ListeningResult" component={ListeningResultScreen} />
    </Stack.Navigator>
  );
}

// ── Writing Stack ─────────────────────────────────────────
function WritingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WritingCompose" component={WritingScreen} />
      <Stack.Screen name="WritingResult" component={WritingResultScreen} />
    </Stack.Navigator>
  );
}

// ── Speaking Stack ────────────────────────────────────────
function SpeakingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Speaking" component={SpeakingScreen} />
      <Stack.Screen name="SpeakingResult" component={SpeakingResultScreen} />
    </Stack.Navigator>
  );
}

// ── Tab Icon component ────────────────────────────────────
function TabIcon({ emoji, label, focused, color }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 2 }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Main Tabs ─────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 10,
        },
      }}
    >
      <Tab.Screen
        name="Listening"
        component={ListeningStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🎧" label="Nghe" focused={focused} color={focused ? '#1565C0' : '#aaa'} />
          ),
          tabBarActiveTintColor: '#1565C0',
        }}
      />
      <Tab.Screen
        name="Writing"
        component={WritingStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="✍️" label="Viết" focused={focused} color={focused ? '#00695C' : '#aaa'} />
          ),
          tabBarActiveTintColor: '#00695C',
        }}
      />
      <Tab.Screen
        name="SpeakingTab"
        component={SpeakingStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🎙" label="Nói" focused={focused} color={focused ? '#6A1B9A' : '#aaa'} />
          ),
          tabBarActiveTintColor: '#6A1B9A',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="📊" label="Lịch sử" focused={focused} color={focused ? '#37474F' : '#aaa'} />
          ),
          tabBarActiveTintColor: '#37474F',
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────
export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
