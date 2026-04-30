import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Zone } from "../hooks/useZones";

interface ZoneModalProps {
  visible: boolean;
  zone: Zone | null;
  commuterCount: number;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ZoneModal({ visible, zone, commuterCount, onClose }: ZoneModalProps) {
  if (!zone) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle (Visual only) */}
              <View style={styles.dragHandle} />

              {/* Zone Image */}
              <View style={styles.imageContainer}>
                {zone.imageurl ? (
                  <Image source={{ uri: zone.imageurl }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                
                {/* Floating Commuter Count Badge */}
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeIcon}>🧑</Text>
                  <Text style={styles.badgeText}>
                    {commuterCount} Waiting
                  </Text>
                </View>
              </View>

              {/* Zone Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.locationText} numberOfLines={2}>
                    {zone.location}
                  </Text>
                  <View style={styles.classificationPill}>
                    <Text style={styles.classificationText}>
                      {zone.classification}
                    </Text>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const SURFACE = "#132534";
const BORDER = "#1f3a4d";
const TEXT_PRIMARY = "#e8f1f8";
const TEXT_MUTED = "#9bb6c9";
const BRAND = "#4c1dda";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Dim background
  },
  sheetContainer: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SCREEN_HEIGHT * 0.45,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    backgroundColor: "#0f1a24",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: TEXT_MUTED,
    fontSize: 16,
  },
  badgeContainer: {
    position: "absolute",
    bottom: 12,
    right: 16,
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  detailsContainer: {
    padding: 24,
    paddingTop: 16,
    flex: 1,
    justifyContent: "space-between",
  },
  headerRow: {
    marginBottom: 20,
  },
  locationText: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  classificationPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(31, 58, 77, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  classificationText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  closeButton: {
    backgroundColor: "rgba(231, 76, 60, 0.15)", // Subtle red background
    borderWidth: 1,
    borderColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "bold",
  },
});
