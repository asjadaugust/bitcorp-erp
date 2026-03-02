import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/approvals/domain/models/approval_request_model.dart';
import 'package:mobile/features/approvals/presentation/providers/approval_action_provider.dart';

class ApprovalDetailScreen extends ConsumerWidget {
  final ApprovalRequestModel request;

  const ApprovalDetailScreen({super.key, required this.request});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only show action buttons if the current user is active.
    // In our mock, if Step 2 is 'me' and state is PENDING, we show it.
    bool canAct = false;
    for (var node in request.lineaTiempo) {
      if (node.estado == 'PENDING' && node.aprobador['id'] == 'me') {
        canAct = true;
        break;
      }
    }

    // In true Sent mode (solicitante.id == me), we generally don't act on our own stuff
    // unless the logic allows it.
    if (request.solicitante['id'] == 'me') {
      canAct = false;
    }

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(title: const Text('Detalle de Solicitud')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AeroTheme.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _RequestSummaryCard(request: request),
            const SizedBox(height: AeroTheme.spacing24),
            const Text(
              'Flujo de Aprobación',
              style: TextStyle(
                fontFamily: AeroTheme.headingFont,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing8),
            _TimelineAuditTrail(timeline: request.lineaTiempo),
            if (canAct) ...[
              const SizedBox(height: AeroTheme.spacing32),
              _ActionButtonsBlock(request: request),
            ],
          ],
        ),
      ),
    );
  }
}

class _RequestSummaryCard extends StatelessWidget {
  final ApprovalRequestModel request;

  const _RequestSummaryCard({required this.request});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APPROVED':
        return const Color(0xFF00C853);
      case 'REJECTED':
        return AeroTheme.accent500;
      case 'PENDING':
      default:
        return AeroTheme.semanticBlue500;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'PENDING':
      default:
        return 'Pendiente';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey300),
      ),
      padding: const EdgeInsets.all(AeroTheme.spacing24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  request.titulo,
                  style: const TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(request.estado),
                  borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                ),
                child: Text(
                  _getStatusText(request.estado),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AeroTheme.spacing16),
          Row(
            children: [
              const Icon(Icons.person, color: AeroTheme.grey500),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Solicitante',
                    style: TextStyle(color: AeroTheme.grey500, fontSize: 12),
                  ),
                  Text(
                    request.solicitante['nombre'] ?? 'Desconocido',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AeroTheme.spacing16),
          const Divider(),
          const SizedBox(height: AeroTheme.spacing16),
          const Text(
            'Descripción',
            style: TextStyle(color: AeroTheme.grey500, fontSize: 12),
          ),
          const SizedBox(height: AeroTheme.spacing4),
          Text(
            request.descripcion,
            style: const TextStyle(color: AeroTheme.grey700),
          ),
        ],
      ),
    );
  }
}

class _TimelineAuditTrail extends StatelessWidget {
  final List<ApprovalTimelineNode> timeline;

  const _TimelineAuditTrail({required this.timeline});

  @override
  Widget build(BuildContext context) {
    if (timeline.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16.0),
        child: Text('No hay historial de aprobación para esta solicitud.'),
      );
    }

    return Container(
      padding: const EdgeInsets.all(AeroTheme.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey300),
      ),
      child: ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: timeline.length,
        itemBuilder: (context, index) {
          final node = timeline[index];
          final isLast = index == timeline.length - 1;

          Color nodeColor;
          IconData iconData;

          if (node.estado == 'APPROVED') {
            nodeColor = const Color(0xFF00C853);
            iconData = Icons.check_circle;
          } else if (node.estado == 'REJECTED') {
            nodeColor = AeroTheme.accent500;
            iconData = Icons.cancel;
          } else {
            nodeColor = AeroTheme.grey500;
            iconData = Icons.radio_button_unchecked;
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Icon(iconData, color: nodeColor),
                  if (!isLast)
                    Container(height: 40, width: 2, color: AeroTheme.grey300),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Paso ${node.paso} - ${node.aprobador['nombre']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AeroTheme.primary900,
                        ),
                      ),
                      if (node.fechaCompletado != null)
                        Text(
                          '${node.fechaCompletado!.toLocal()}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AeroTheme.grey500,
                          ),
                        ),
                      if (node.comentario != null &&
                          node.comentario!.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AeroTheme.grey100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '"${node.comentario}"',
                            style: const TextStyle(
                              fontStyle: FontStyle.italic,
                              color: AeroTheme.grey700,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ActionButtonsBlock extends ConsumerStatefulWidget {
  final ApprovalRequestModel request;
  const _ActionButtonsBlock({required this.request});

  @override
  ConsumerState<_ActionButtonsBlock> createState() =>
      _ActionButtonsBlockState();
}

class _ActionButtonsBlockState extends ConsumerState<_ActionButtonsBlock> {
  final _commentController = TextEditingController();

  Future<void> _showRejectDialog() async {
    _commentController.clear();
    return showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Rechazar Solicitud'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Debe proporcionar un motivo para el rechazo. Este será visible en el flujo de aprobación.',
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _commentController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Motivo (Requerido)',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AeroTheme.accent500,
              ),
              onPressed: () {
                if (_commentController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('El motivo es requerido.')),
                  );
                  return;
                }
                Navigator.pop(context);
                HapticFeedback.mediumImpact();
                ref
                    .read(approvalActionProvider.notifier)
                    .rejectRequest(
                      widget.request.id,
                      _commentController.text.trim(),
                    );
                context.pop(); // Pop back to list
              },
              child: const Text(
                'Confirmar Rechazo',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  void _approve() {
    HapticFeedback.mediumImpact();
    ref
        .read(approvalActionProvider.notifier)
        .approveRequest(widget.request.id, null);
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ElevatedButton(
          onPressed: _approve,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00C853),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: const Text(
            'Aprobar Solicitud',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ),
        const SizedBox(height: AeroTheme.spacing16),
        OutlinedButton(
          onPressed: _showRejectDialog,
          style: OutlinedButton.styleFrom(
            foregroundColor: AeroTheme.accent500,
            side: const BorderSide(color: AeroTheme.accent500),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: const Text('Rechazar', style: TextStyle(fontSize: 16)),
        ),
      ],
    );
  }
}
