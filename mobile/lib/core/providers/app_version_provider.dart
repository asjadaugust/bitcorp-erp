import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AppVersionState {
  final String currentVersion;
  final String minSupportedVersion;
  final bool isUpdateRequired;

  AppVersionState({
    required this.currentVersion,
    required this.minSupportedVersion,
    required this.isUpdateRequired,
  });
}

// Mock fetching the minimum supported version from an API or Remote Config
final minSupportedVersionProvider = FutureProvider<String>((ref) async {
  await Future.delayed(const Duration(milliseconds: 500));
  // In a real scenario, this comes from the backend.
  // Returning 0.0.1 by default so it doesn't block developers.
  // To test the blocking UI, change this back to something like 2.0.0.
  return "0.0.1";
});

final appVersionProvider = FutureProvider<AppVersionState>((ref) async {
  final minVersion = await ref.watch(minSupportedVersionProvider.future);

  final packageInfo = await PackageInfo.fromPlatform();
  final currentVersion = packageInfo.version;

  bool updateRequired = false;

  final currentParts = currentVersion
      .split('.')
      .map(int.tryParse)
      .map((e) => e ?? 0)
      .toList();
  final minParts = minVersion
      .split('.')
      .map(int.tryParse)
      .map((e) => e ?? 0)
      .toList();

  for (int i = 0; i < currentParts.length && i < minParts.length; i++) {
    if (currentParts[i] < minParts[i]) {
      updateRequired = true;
      break;
    } else if (currentParts[i] > minParts[i]) {
      break;
    }
  }

  return AppVersionState(
    currentVersion: currentVersion,
    minSupportedVersion: minVersion,
    isUpdateRequired: updateRequired,
  );
});
