import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "./theme";

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfacePage,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statTile: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 4,
  },
  statDelta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.gridline,
    gap: spacing.sm,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface1,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  btnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  btnPrimaryText: {
    color: colors.accentInk,
  },
  btnDanger: {
    borderColor: colors.statusCritical,
  },
  btnDangerText: {
    color: colors.statusCritical,
  },
  field: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface2,
  },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSunken,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 5,
    alignItems: "center",
  },
  segmentedBtnActive: {
    backgroundColor: colors.surface1,
  },
  segmentedText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  segmentedTextActive: {
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceSunken,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
