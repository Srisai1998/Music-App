import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AlbumScreen({ route }: any) {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Album Screen</Text>
      <Text style={styles.s}>albumId: {route.params?.albumId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  t: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  s: { color: '#b3b3b3', marginTop: 8 },
});
