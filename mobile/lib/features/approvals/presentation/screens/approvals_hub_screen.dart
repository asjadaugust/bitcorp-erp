import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/approvals/domain/models/approval_request_model.dart';
import 'package:mobile/features/approvals/presentation/providers/approvals_provider.dart';
import 'package:mobile/features/notifications/presentation/widgets/notification_bell_button.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/widgets/empty_state_widget.dart';
import 'package:mobile/core/widgets/error_state_widget.dart';
import 'package:mobile/core/widgets/shimmer_loading.dart';
import 'package:mobile/core/widgets/status_badge.dart';

class ApprovalsHubScreen extends ConsumerStatefulWidget {
  const ApprovalsHubScreen({super.key});

  @override
  ConsumerState<ApprovalsHubScreen> createState() => _ApprovalsHubScreenState();
}

class _ApprovalsHubScreenState extends ConsumerState<ApprovalsHubScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final receivedCount = ref.watch(receivedCountProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Centro de Aprobaciones'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(context: context, delegate: GlobalSearchDelegate(ref.read(dioProvider)));
            },
          ),
          const NotificationBellButton(),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AeroTheme.primary500,
          unselectedLabelColor: AeroTheme.grey500,
          indicatorColor: AeroTheme.primary500,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Recibidos'),
                  if (receivedCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AeroTheme.accent500,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        receivedCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Tab(text: 'Enviados'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_RecibidosList(), _EnviadosList()],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Implement Ad-Hoc form creation
        },
        backgroundColor: AeroTheme.primary500,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Nueva Solicitud',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

class _RecibidosList extends ConsumerWidget {
  const _RecibidosList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(recibidosListProvider);

    return state.when(
      data: (items) {
        if (items.isEmpty) {
          return const EmptyStateWidget(
            icon: Icons.check_circle_outline,
            title: 'No tienes aprobaciones pendientes',
            subtitle: 'Las solicitudes que recibas aparecerán aquí.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async =>
              ref.read(recibidosListProvider.notifier).refresh(),
          child: ListView.builder(
            padding: const EdgeInsets.all(AeroTheme.spacing16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              return _ApprovalCard(request: items[index], isSentMode: false);
            },
          ),
        );
      },
      loading: () => const ShimmerLoadingList(),
      error: (e, st) => ErrorStateWidget(
        message: 'Error al cargar aprobaciones',
        onRetry: () => ref.read(recibidosListProvider.notifier).refresh(),
      ),
    );
  }
}

class _EnviadosList extends ConsumerWidget {
  const _EnviadosList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(enviadosListProvider);

    return state.when(
      data: (items) {
        if (items.isEmpty) {
          return const EmptyStateWidget(
            icon: Icons.send_outlined,
            title: 'No has enviado solicitudes',
            subtitle: 'Las solicitudes que envíes aparecerán aquí.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async =>
              ref.read(enviadosListProvider.notifier).refresh(),
          child: ListView.builder(
            padding: const EdgeInsets.all(AeroTheme.spacing16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              return _ApprovalCard(request: items[index], isSentMode: true);
            },
          ),
        );
      },
      loading: () => const ShimmerLoadingList(),
      error: (e, st) => ErrorStateWidget(
        message: 'Error al cargar solicitudes',
        onRetry: () => ref.read(enviadosListProvider.notifier).refresh(),
      ),
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  final ApprovalRequestModel request;
  final bool isSentMode;

  const _ApprovalCard({required this.request, required this.isSentMode});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AeroTheme.spacing16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      color: Colors.white,
      child: InkWell(
        onTap: () {
          context.push('/approvals/${request.id}', extra: request);
        },
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(AeroTheme.spacing16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  StatusBadge.fromStatus(request.estado),
                  Text(
                    '${request.fechaCreacion.day}/${request.fechaCreacion.month}/${request.fechaCreacion.year}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AeroTheme.grey500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AeroTheme.spacing16),
              Text(
                request.titulo,
                style: const TextStyle(
                  fontFamily: AeroTheme.headingFont,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AeroTheme.primary900,
                ),
              ),
              const SizedBox(height: AeroTheme.spacing8),
              Row(
                children: [
                  const Icon(
                    Icons.person_outline,
                    size: 16,
                    color: AeroTheme.grey500,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      isSentMode
                          ? 'Enviado por ti'
                          : 'De: ${request.solicitante['nombre'] ?? 'Desconocido'}',
                      style: const TextStyle(color: AeroTheme.grey700),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
