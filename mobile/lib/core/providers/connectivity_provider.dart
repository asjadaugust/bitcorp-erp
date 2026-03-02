import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'connectivity_provider.g.dart';

@riverpod
Stream<bool> connectivity(Ref ref) async* {
  // Emit initial state
  final initial = await Connectivity().checkConnectivity();
  yield initial.contains(ConnectivityResult.mobile) ||
      initial.contains(ConnectivityResult.wifi) ||
      initial.contains(ConnectivityResult.ethernet);

  // Listen for changes
  await for (final results in Connectivity().onConnectivityChanged) {
    yield results.contains(ConnectivityResult.mobile) ||
        results.contains(ConnectivityResult.wifi) ||
        results.contains(ConnectivityResult.ethernet);
  }
}
