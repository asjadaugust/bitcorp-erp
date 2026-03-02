import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/app_version_provider.dart';
import 'package:mobile/core/theme/aero_theme.dart';

class ForcedUpdateWrapper extends ConsumerWidget {
  final Widget child;

  const ForcedUpdateWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final versionStateAsync = ref.watch(appVersionProvider);

    return versionStateAsync.when(
      data: (state) {
        if (state.isUpdateRequired) {
          return Scaffold(
            backgroundColor: AeroTheme.primary900,
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.system_update,
                      size: 80,
                      color: AeroTheme.primary500,
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Actualización Requerida',
                      style: TextStyle(
                        fontFamily: AeroTheme.headingFont,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AeroTheme.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Tu versión actual es \${state.currentVersion}. La versión mínima soportada es \${state.minSupportedVersion}. Por favor, actualiza la aplicación para continuar.',
                      style: const TextStyle(
                        fontSize: 16,
                        color: AeroTheme.grey300,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AeroTheme.primary500,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              AeroTheme.radiusSm,
                            ),
                          ),
                        ),
                        onPressed: () {
                          // Here you would launch the App Store or Play Store
                          // using url_launcher
                        },
                        child: const Text(
                          'Actualizar Ahora',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AeroTheme.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        // Feature isn't blocking, return normal app
        return child;
      },
      loading: () => const Scaffold(
        backgroundColor: AeroTheme.primary900,
        body: Center(
          child: CircularProgressIndicator(color: AeroTheme.primary500),
        ),
      ),
      error: (e, s) => child, // If it fails to check, let them use the app
    );
  }
}
