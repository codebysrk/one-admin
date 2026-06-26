import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from '../../core/ThemeContext';
import { SPACING, RADIUS   } from "../../core/theme";


import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AdminScreen,
  AdminHeader,
  Card,
  Button,
  FormField,
  IconButton,
  LoadingState,
} from "../../components/AdminUI";
import { logActivity } from "../../services/logService";

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Trash = IconWrapper("trash-can-outline");
const Edit = IconWrapper("pencil-outline");
const Plus = IconWrapper("plus");
const Save = IconWrapper("content-save-outline");
const Undo = IconWrapper("undo-variant");

interface FareSlab {
  minKm: number;
  maxKm: number | null;
  nonACFare: number;
  acFare: number;
}

const DEFAULT_FARE_CONFIG = {
  delhiSlabs: [
    { minKm: 0, maxKm: 4, nonACFare: 5, acFare: 10 },
    { minKm: 4.1, maxKm: 8, nonACFare: 10, acFare: 15 },
    { minKm: 8.1, maxKm: 12, nonACFare: 15, acFare: 20 },
    { minKm: 12.1, maxKm: null, nonACFare: 15, acFare: 25 },
  ],
  interstateSlabs: [
    { minKm: 0, maxKm: 4, nonACFare: 5, acFare: 10 },
    { minKm: 4.1, maxKm: 8, nonACFare: 10, acFare: 15 },
    { minKm: 8.1, maxKm: 12, nonACFare: 15, acFare: 20 },
    { minKm: 12.1, maxKm: 16, nonACFare: 20, acFare: 25 },
    { minKm: 16.1, maxKm: 20, nonACFare: 25, acFare: 30 },
    { minKm: 20.1, maxKm: 24, nonACFare: 30, acFare: 35 },
    { minKm: 24.1, maxKm: 28, nonACFare: 35, acFare: 40 },
    { minKm: 28.1, maxKm: 32, nonACFare: 40, acFare: 45 },
    { minKm: 32.1, maxKm: 36, nonACFare: 45, acFare: 50 },
    { minKm: 36.1, maxKm: 40, nonACFare: 50, acFare: 55 },
    { minKm: 40.1, maxKm: null, nonACFare: 55, acFare: 60 },
  ],
};

export const FareConfigScreen = () => {
  const { colors } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const [activeTab, setActiveTab] = useState<"delhi" | "interstate">("delhi");
  const [delhiSlabs, setDelhiSlabs] = useState<FareSlab[]>([]);
  const [interstateSlabs, setInterstateSlabs] = useState<FareSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [minKm, setMinKm] = useState("");
  const [maxKm, setMaxKm] = useState("");
  const [nonACFare, setNonACFare] = useState("");
  const [acFare, setAcFare] = useState("");

  const docRef = useMemo(() => doc(db, "configs", "fare_config"), []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDelhiSlabs(data.delhiSlabs || []);
        setInterstateSlabs(data.interstateSlabs || []);
      } else {
        // Seed database if document doesn't exist
        await setDoc(docRef, DEFAULT_FARE_CONFIG);
        setDelhiSlabs(DEFAULT_FARE_CONFIG.delhiSlabs);
        setInterstateSlabs(DEFAULT_FARE_CONFIG.interstateSlabs);
      }
    } catch (e) {
      console.warn("Failed to load fare configs:", e);
      Alert.alert("Error", "Could not load fare configurations from database.");
    } finally {
      setLoading(false);
    }
  }, [docRef]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sort slabs by minKm before saving
      const sortedDelhi = [...delhiSlabs].sort((a, b) => a.minKm - b.minKm);
      const sortedInterstate = [...interstateSlabs].sort(
        (a, b) => a.minKm - b.minKm
      );

      await setDoc(docRef, {
        delhiSlabs: sortedDelhi,
        interstateSlabs: sortedInterstate,
      });

      setDelhiSlabs(sortedDelhi);
      setInterstateSlabs(sortedInterstate);

      await logActivity({
        type: "ADMIN",
        action: "FARE_CONFIG_UPDATED",
        details: "Fare slabs configuration was updated.",
      });

      Alert.alert("Success", "Fare configurations saved successfully.");
    } catch (e) {
      console.warn("Failed to save fare configurations:", e);
      Alert.alert("Error", "Failed to save configurations.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      "Reset Slabs",
      "Are you sure you want to reset all fare configurations back to default settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setDelhiSlabs(DEFAULT_FARE_CONFIG.delhiSlabs);
            setInterstateSlabs(DEFAULT_FARE_CONFIG.interstateSlabs);
          },
        },
      ]
    );
  };

  const handleDelete = (index: number) => {
    const list = activeTab === "delhi" ? delhiSlabs : interstateSlabs;
    Alert.alert("Delete Slab", "Are you sure you want to delete this fare slab?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = list.filter((_, idx) => idx !== index);
          if (activeTab === "delhi") {
            setDelhiSlabs(updated);
          } else {
            setInterstateSlabs(updated);
          }
        },
      },
    ]);
  };

  const openEditModal = (slab: FareSlab | null, index: number | null) => {
    setEditIndex(index);
    if (slab) {
      setMinKm(slab.minKm.toString());
      setMaxKm(slab.maxKm !== null ? slab.maxKm.toString() : "");
      setNonACFare(slab.nonACFare.toString());
      setAcFare(slab.acFare.toString());
    } else {
      setMinKm("");
      setMaxKm("");
      setNonACFare("");
      setAcFare("");
    }
    setModalVisible(true);
  };

  const saveModalData = () => {
    const parsedMin = parseFloat(minKm);
    const parsedMax = maxKm.trim() === "" ? null : parseFloat(maxKm);
    const parsedNonAC = parseInt(nonACFare);
    const parsedAC = parseInt(acFare);

    if (
      isNaN(parsedMin) ||
      (maxKm.trim() !== "" && parsedMax !== null && isNaN(parsedMax)) ||
      isNaN(parsedNonAC) ||
      isNaN(parsedAC)
    ) {
      Alert.alert("Invalid Input", "Please fill in all values correctly.");
      return;
    }

    const updatedSlab: FareSlab = {
      minKm: parsedMin,
      maxKm: parsedMax,
      nonACFare: parsedNonAC,
      acFare: parsedAC,
    };

    const list = activeTab === "delhi" ? delhiSlabs : interstateSlabs;
    let updated: FareSlab[];

    if (editIndex !== null) {
      updated = list.map((item, idx) => (idx === editIndex ? updatedSlab : item));
    } else {
      updated = [...list, updatedSlab];
    }

    if (activeTab === "delhi") {
      setDelhiSlabs(updated);
    } else {
      setInterstateSlabs(updated);
    }

    setModalVisible(false);
  };

  const renderTabButton = (tab: "delhi" | "interstate", label: string) => {
    const isSelected = activeTab === tab;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(tab)}
        style={[styles.tabButton, isSelected && styles.tabButtonActive]}
      >
        <Text
          style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const activeSlabs = activeTab === "delhi" ? delhiSlabs : interstateSlabs;

  return (
    <AdminScreen>
      <AdminHeader
        title="Fare Slabs"
        subtitle="Manage route distances, tolls, and slab fares"
        action={
          <IconButton
            tone="neutral"
            accessibilityLabel="Reset to defaults"
            onPress={handleResetToDefaults}
          >
            <Undo size={18} color={colors.text} />
          </IconButton>
        }
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton("delhi", "Delhi Slabs")}
        {renderTabButton("interstate", "Interstate Slabs")}
      </View>

      {loading ? (
        <LoadingState label="Loading Slabs Configuration..." />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeSlabs.map((slab, index) => (
            <Card key={index} style={styles.slabCard}>
              <View style={styles.slabInfo}>
                <View style={styles.distanceBlock}>
                  <Text style={styles.slabLabel}>Distance Range</Text>
                  <Text style={styles.slabValue}>
                    {slab.minKm} km - {slab.maxKm !== null ? `${slab.maxKm} km` : "∞"}
                  </Text>
                </View>

                <View style={styles.fareGrid}>
                  <View style={styles.fareBlock}>
                    <Text style={styles.fareLabel}>Non-AC Fare</Text>
                    <Text style={styles.fareValue}>₹{slab.nonACFare}</Text>
                  </View>
                  <View style={styles.fareBlock}>
                    <Text style={styles.fareLabel}>AC Fare</Text>
                    <Text style={[styles.fareValue, { color: colors.primary }]}>
                      ₹{slab.acFare}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionBlock}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(slab, index)}
                >
                  <Edit size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(index)}
                >
                  <Trash size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          <Button
            title="Add New Slab"
            tone="accent"
            icon={<Plus size={18} color={colors.white} />}
            onPress={() => openEditModal(null, null)}
            style={styles.addButton}
          />
        </ScrollView>
      )}

      {/* Fixed bottom controls */}
      {!loading && (
        <View style={styles.bottomControls}>
          <Button
            title={saving ? "Saving..." : "Save Config to Server"}
            tone="success"
            loading={saving}
            icon={<Save size={18} color={colors.white} />}
            onPress={handleSave}
            fullWidth
          />
        </View>
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editIndex !== null ? "Edit Fare Slab" : "Create Fare Slab"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <FormField
                label="Minimum Distance (Km)"
                keyboardType="numeric"
                value={minKm}
                onChangeText={setMinKm}
                placeholder="e.g. 0 or 8.1"
              />

              <FormField
                label="Maximum Distance (Km) - Leave blank for no limit"
                keyboardType="numeric"
                value={maxKm}
                onChangeText={setMaxKm}
                placeholder="e.g. 4 or 12"
              />

              <FormField
                label="Non-AC Bus Fare (₹)"
                keyboardType="numeric"
                value={nonACFare}
                onChangeText={setNonACFare}
                placeholder="e.g. 10"
              />

              <FormField
                label="AC Bus Fare (₹)"
                keyboardType="numeric"
                value={acFare}
                onChangeText={setAcFare}
                placeholder="e.g. 15"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveModalData}
              >
                <Text style={styles.modalSaveText}>Save Slab</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreen>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    padding: 6,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: RADIUS.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  slabCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
  },
  slabInfo: {
    flex: 1,
    gap: 12,
  },
  distanceBlock: {},
  slabLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  slabValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  fareGrid: {
    flexDirection: "row",
    gap: 24,
  },
  fareBlock: {},
  fareLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  fareValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  actionBlock: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    borderColor: colors.primary + "33",
    backgroundColor: colors.primarySoft,
  },
  deleteButton: {
    borderColor: colors.error + "33",
    backgroundColor: colors.errorSoft,
  },
  addButton: {
    marginTop: 10,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  modalForm: {
    gap: 16,
    paddingBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  modalSaveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
});
