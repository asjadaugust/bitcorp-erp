import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:mobile/core/widgets/placeholder_screen.dart';
import 'package:mobile/core/widgets/app_shell.dart';
import 'package:mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:mobile/features/daily_report/presentation/screens/daily_report_list_screen.dart';
import 'package:mobile/features/daily_report/presentation/screens/daily_report_form_screen.dart';
import 'package:mobile/features/dashboard/presentation/screens/operator_dashboard_screen.dart';

part 'app_router.g.dart';

@riverpod
GoRouter goRouter(Ref ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuth = authState.status == AuthStatus.authenticated;
      final isLoggingIn = state.uri.path == '/login';

      if (authState.status == AuthStatus.initial) {
        return null; // Wait for initial check
      }

      if (!isAuth && !isLoggingIn) {
        return '/login';
      }

      if (isAuth && isLoggingIn) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          // If supervisor, we might want a different shell, but for now we'll restrict access inside the tabs or redirect.
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) {
                  final role = authState.role;
                  if (role == 'SUPERVISOR') {
                    return const PlaceholderScreen(
                      title: 'Supervisor Dashboard',
                    );
                  }
                  return const OperatorDashboardScreen();
                },
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/reports',
                builder: (context, state) => const DailyReportListScreen(),
                routes: [
                  GoRoute(
                    path: 'new',
                    builder: (context, state) => const DailyReportFormScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/vouchers',
                builder: (context, state) =>
                    const PlaceholderScreen(title: 'Vales de Combustible'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/checklists',
                builder: (context, state) =>
                    const PlaceholderScreen(title: 'Checklists'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/approvals',
                builder: (context, state) =>
                    const PlaceholderScreen(title: 'Aprobaciones'),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
