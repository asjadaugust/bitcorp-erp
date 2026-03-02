import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';

import 'package:mobile/core/widgets/app_shell.dart';
import 'package:mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:mobile/features/daily_report/presentation/screens/daily_report_list_screen.dart';
import 'package:mobile/features/daily_report/presentation/screens/daily_report_form_screen.dart';
import 'package:mobile/features/daily_report/presentation/screens/daily_report_detail_screen.dart';
import 'package:mobile/features/daily_report/domain/models/daily_report_model.dart';
import 'package:mobile/features/dashboard/presentation/screens/operator_dashboard_screen.dart';
import 'package:mobile/features/dashboard/presentation/screens/supervisor_dashboard_screen.dart';
import 'package:mobile/features/checklists/presentation/screens/checklist_list_screen.dart';
import 'package:mobile/features/checklists/presentation/screens/checklist_form_screen.dart';
import 'package:mobile/features/checklists/presentation/screens/checklist_detail_screen.dart';
import 'package:mobile/features/checklists/domain/models/checklist_model.dart';
import 'package:mobile/features/checklists/presentation/screens/incidente_form_screen.dart';
import 'package:mobile/features/vouchers/presentation/screens/vale_list_screen.dart';
import 'package:mobile/features/vouchers/presentation/screens/vale_form_screen.dart';
import 'package:mobile/features/vouchers/presentation/screens/vale_detail_screen.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:mobile/features/approvals/presentation/screens/approvals_hub_screen.dart';
import 'package:mobile/features/approvals/presentation/screens/approval_detail_screen.dart';
import 'package:mobile/features/approvals/presentation/screens/ad_hoc_approval_form_screen.dart';
import 'package:mobile/features/approvals/domain/models/approval_request_model.dart';
import 'package:mobile/features/equipment/presentation/screens/equipment_detail_screen.dart';
import 'package:mobile/features/valorizations/presentation/screens/valorizations_list_screen.dart';

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
                    return const SupervisorDashboardScreen();
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
                  GoRoute(
                    path: ':id',
                    pageBuilder: (context, state) {
                      final report = state.extra as DailyReportModel;
                      return _slideTransition(
                        state,
                        DailyReportDetailScreen(report: report),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/vouchers',
                builder: (context, state) => const ValeListScreen(),
                routes: [
                  GoRoute(
                    path: 'new',
                    builder: (context, state) => const ValeFormScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    pageBuilder: (context, state) {
                      final vale = state.extra as ValeCombustibleModel;
                      return _slideTransition(
                        state,
                        ValeDetailScreen(vale: vale),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/checklists',
                builder: (context, state) => const ChecklistListScreen(),
                routes: [
                  GoRoute(
                    path: 'new',
                    builder: (context, state) => const ChecklistFormScreen(),
                  ),
                  GoRoute(
                    path: 'incidente',
                    builder: (context, state) => const IncidenteFormScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    pageBuilder: (context, state) {
                      final checklist = state.extra as ChecklistModel;
                      return _slideTransition(
                        state,
                        ChecklistDetailScreen(checklist: checklist),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/approvals',
                builder: (context, state) => const ApprovalsHubScreen(),
                routes: [
                  GoRoute(
                    path: 'new',
                    builder: (context, state) =>
                        const AdHocApprovalFormScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    pageBuilder: (context, state) {
                      final item = state.extra as ApprovalRequestModel;
                      return _slideTransition(
                        state,
                        ApprovalDetailScreen(request: item),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/equipment/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return EquipmentDetailScreen(id: id);
        },
      ),
      GoRoute(
        path: '/valorizations',
        builder: (context, state) => const ValorizationsListScreen(),
      ),
    ],
  );
}

/// Slide-from-right page transition for detail routes.
CustomTransitionPage<void> _slideTransition(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 250),
    reverseTransitionDuration: const Duration(milliseconds: 200),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final tween = Tween<Offset>(
        begin: const Offset(1.0, 0.0),
        end: Offset.zero,
      ).chain(CurveTween(curve: Curves.easeOutCubic));
      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );
    },
  );
}
