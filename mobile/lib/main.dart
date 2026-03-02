import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/core/routing/app_router.dart';
import 'package:mobile/core/widgets/forced_update_wrapper.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: BitCorpMobileApp()));
}

class BitCorpMobileApp extends ConsumerWidget {
  const BitCorpMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'BitCorp ERP',
      theme: AeroTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return ForcedUpdateWrapper(child: child!);
      },
    );
  }
}
