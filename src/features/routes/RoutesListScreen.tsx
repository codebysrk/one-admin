import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { Plus, Trash2, MapPin, Bus, ArrowRight } from 'lucide-react-native';

export const RoutesListScreen = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'routes'), (snapshot) => {
      const routeData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const upDir = data.directions?.up;
        const downDir = data.directions?.down;
        return {
          id: docSnap.id,
          routeNumber: data.route || docSnap.id,
          origin: upDir?.from || 'N/A',
          destination: upDir?.to || 'N/A',
          totalStopsUp: upDir?.totalStops || upDir?.stops?.length || 0,
          totalStopsDown: downDir?.totalStops || downDir?.stops?.length || 0,
        };
      });
      // Sort by route number
      routeData.sort((a, b) => {
        const numA = parseInt(a.routeNumber) || 0;
        const numB = parseInt(b.routeNumber) || 0;
        if (numA !== numB) return numA - numB;
        return a.routeNumber.localeCompare(b.routeNumber);
      });
      setRoutes(routeData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching routes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string, routeName: string) => {
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete route ${routeName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'routes', id));
            } catch (error) {
              Alert.alert("Error", "Could not delete route");
            }
          }
        }
      ]
    );
  };

  const renderRouteItem = ({ item }: any) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeNumberContainer}>
          <Bus size={18} color="white" />
          <Text style={styles.routeNumber}>{item.routeNumber}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.routeNumber)}>
          <Trash2 size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.routeDetails}>
        <View style={styles.locationRow}>
          <MapPin size={14} color="#10B981" />
          <Text style={styles.locationText}>{item.origin}</Text>
          <ArrowRight size={14} color={COLORS.textMuted} />
          <Text style={styles.locationText}>{item.destination}</Text>
        </View>
        <View style={styles.stopsRow}>
          <Text style={styles.stopCount}>↑ Up: {item.totalStopsUp} Stops</Text>
          <Text style={styles.stopCount}>↓ Down: {item.totalStopsDown} Stops</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route Management</Text>
        <Text style={styles.headerSubtitle}>{routes.length} routes</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No routes found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    padding: 24, 
    backgroundColor: 'white', 
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 60
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  listContent: { padding: 16 },
  routeCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routeNumberContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  routeNumber: { color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },
  routeDetails: { gap: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  locationText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  stopsRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  stopCount: { fontSize: 12, color: COLORS.textMuted },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted, fontSize: 16 }
});
