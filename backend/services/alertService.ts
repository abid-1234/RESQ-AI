import Alert from '../models/Alert.ts';

export const createAlert = async (alertData: any) => new Alert({ alertId: `ALT-${Date.now()}`, ...alertData, createdAt: new Date() }).save();

export const getActiveAlerts = async () => Alert.find({ status: { $in: ['DISPATCHED', 'ACKNOWLEDGED'] }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
export const getAllAlerts = async (limit: number = 50) => Alert.find().sort({ createdAt: -1 }).limit(limit);
export const getAlertsByIncident = async (incidentId: string) => Alert.find({ incidentId }).sort({ createdAt: -1 });

export const dispatchAlert = async (alertId: string) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 4);
  return Alert.findOneAndUpdate({ alertId }, { status: 'DISPATCHED', dispatchedAt: new Date(), expiresAt }, { new: true });
};

export const updateAlertDeliveryStatus = async (alertId: string, successRate: number, acknowledgedCount: number) => Alert.findOneAndUpdate(
  { alertId },
  { deliverySuccessRate: successRate, status: acknowledgedCount > 0 ? 'ACKNOWLEDGED' : 'DISPATCHED', updatedAt: new Date() },
  { new: true },
);

export const expireOldAlerts = async () => Alert.updateMany(
  { expiresAt: { $lt: new Date() }, status: { $ne: 'EXPIRED' } },
  { status: 'EXPIRED' },
);

export const getAlertStatistics = async () => {
  const alerts = await Alert.find();
  return {
    totalAlerts: alerts.length,
    bySeverity: {
      CRITICAL: alerts.filter((alert) => alert.severity === 'CRITICAL').length,
      HIGH: alerts.filter((alert) => alert.severity === 'HIGH').length,
      MEDIUM: alerts.filter((alert) => alert.severity === 'MEDIUM').length,
      LOW: alerts.filter((alert) => alert.severity === 'LOW').length,
    },
    byStatus: {
      DISPATCHED: alerts.filter((alert) => alert.status === 'DISPATCHED').length,
      ACKNOWLEDGED: alerts.filter((alert) => alert.status === 'ACKNOWLEDGED').length,
      EXPIRED: alerts.filter((alert) => alert.status === 'EXPIRED').length,
    },
    averageDeliverySuccessRate: alerts.length > 0 ? Math.round(alerts.reduce((sum, alert) => sum + alert.deliverySuccessRate, 0) / alerts.length) : 0,
    recentAlerts: alerts.slice(0, 10),
  };
};

export const broadcastAlert = async (alertData: any) => {
  const alert = await createAlert({ ...alertData, status: 'SCHEDULED' });
  await dispatchAlert(alert.alertId);
  return alert;
};
