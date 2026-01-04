import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import type { User } from '@/assets/data/users';

export type TinderCardProps = {
  user: User;
};

export function TinderCard({ user }: TinderCardProps) {
  return (
    <View style={styles.card}>
      <ImageBackground source={{ uri: user.image }} style={styles.image}>
        <View style={styles.cardInner}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#fefefe',
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,

    elevation: 11,
  },
  image: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardInner: {
    padding: 12,
  },
  name: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  bio: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 24,
  },
});
