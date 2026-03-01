class SyncConflict {
  final String recordId;
  final String recordType; // 'DAILY_REPORT', 'CHECKLIST', 'INCIDENT'
  final Map<String, dynamic> localData;
  final Map<String, dynamic> remoteData;
  final String message;

  const SyncConflict({
    required this.recordId,
    required this.recordType,
    required this.localData,
    required this.remoteData,
    required this.message,
  });
}
