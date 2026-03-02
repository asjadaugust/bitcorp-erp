import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/aero_theme.dart';
import '../../domain/models/checklist_model.dart';
import '../providers/checklist_list_provider.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';

class ChecklistListScreen extends ConsumerStatefulWidget {
  const ChecklistListScreen({super.key});

  @override
  ConsumerState<ChecklistListScreen> createState() =>
      _ChecklistListScreenState();
}

class _ChecklistListScreenState extends ConsumerState<ChecklistListScreen> {
  String _searchQuery = '';
  String _selectedStatus = 'Todos';

  @override
  Widget build(BuildContext context) {
    final checklistsAsync = ref.watch(checklistListProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text(
          'Checklists Pre-Uso',
          style: TextStyle(
            color: AeroTheme.primary900,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AeroTheme.white,
        centerTitle: false,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AeroTheme.primary900),
            onPressed: () {
              showSearch(context: context, delegate: GlobalSearchDelegate());
            },
          ),
          IconButton(
            icon: const Icon(
              Icons.notifications_none,
              color: AeroTheme.primary900,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.account_circle, color: AeroTheme.primary900),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: checklistsAsync.when(
              data: (checklists) {
                final filtered = _filterChecklists(checklists);
                if (filtered.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(checklistListProvider.notifier).refresh();
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return _buildChecklistCard(filtered[index]);
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error: \$err')),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/checklists/new'),
        backgroundColor: AeroTheme.primary500,
        icon: const Icon(Icons.add, color: AeroTheme.white),
        label: const Text(
          'Nuevo Checklist',
          style: TextStyle(color: AeroTheme.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      color: AeroTheme.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: 'Buscar por equipo...',
              prefixIcon: const Icon(Icons.search, color: AeroTheme.grey500),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                borderSide: const BorderSide(color: AeroTheme.grey300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                borderSide: const BorderSide(color: AeroTheme.grey300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                borderSide: const BorderSide(color: AeroTheme.primary500),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
            onChanged: (val) {
              setState(() {
                _searchQuery = val.toLowerCase();
              });
            },
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('Todos'),
                const SizedBox(width: 8),
                _buildFilterChip('Aprobado (PASS)'),
                const SizedBox(width: 8),
                _buildFilterChip('Fallido (FAIL)'),
                const SizedBox(width: 8),
                _buildFilterChip('Pendiente Sync'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedStatus == label;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedStatus = label;
          });
        }
      },
      selectedColor: AeroTheme.primary500.withOpacity(0.1),
      labelStyle: TextStyle(
        color: isSelected ? AeroTheme.primary500 : AeroTheme.grey700,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      backgroundColor: AeroTheme.grey100,
      side: BorderSide(
        color: isSelected ? AeroTheme.primary500 : AeroTheme.grey300,
      ),
    );
  }

  List<ChecklistModel> _filterChecklists(List<ChecklistModel> all) {
    return all.where((c) {
      final matchesSearch = c.idEquipo.toLowerCase().contains(_searchQuery);
      bool matchesStatus = true;
      if (_selectedStatus == 'Aprobado (PASS)') {
        matchesStatus = c.estado == 'PASS';
      } else if (_selectedStatus == 'Fallido (FAIL)') {
        matchesStatus = c.estado == 'FAIL';
      } else if (_selectedStatus == 'Pendiente Sync') {
        matchesStatus = c.estadoSincronizacion == 'PENDING_SYNC';
      }
      return matchesSearch && matchesStatus;
    }).toList();
  }

  Widget _buildChecklistCard(ChecklistModel checklist) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AeroTheme.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                checklist.tipo == 'DAILY'
                    ? 'Checklist Diario'
                    : 'Checklist Semanal',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: AeroTheme.primary900,
                ),
              ),
              _buildStatusBadge(checklist),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.directions_car,
                size: 16,
                color: AeroTheme.grey500,
              ),
              const SizedBox(width: 4),
              Text(
                checklist.idEquipo,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AeroTheme.primary900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.calendar_today,
                size: 16,
                color: AeroTheme.grey500,
              ),
              const SizedBox(width: 4),
              Text(
                _formatDate(checklist.fecha),
                style: const TextStyle(fontSize: 14, color: AeroTheme.grey700),
              ),
            ],
          ),
          if (checklist.estadoSincronizacion == 'PENDING_SYNC') ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AeroTheme.grey200,
                borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.cloud_upload_outlined,
                    size: 14,
                    color: AeroTheme.grey700,
                  ),
                  SizedBox(width: 4),
                  Text(
                    'Pendiente de Sincronización',
                    style: TextStyle(fontSize: 12, color: AeroTheme.grey700),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(ChecklistModel checklist) {
    Color bgColor;
    Color textColor;
    String text;

    if (checklist.estado == 'PASS') {
      bgColor = AeroTheme.semanticBlue100;
      textColor = AeroTheme.semanticBlue500;
      text = 'Aprobado';
    } else if (checklist.estado == 'FAIL') {
      bgColor = AeroTheme.accent500.withOpacity(0.1);
      textColor = AeroTheme.accent500;
      text = 'Con Fallas';
    } else {
      bgColor = AeroTheme.grey200;
      textColor = AeroTheme.grey700;
      text = 'Borrador';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd MMM yyyy, HH:mm').format(date);
    } catch (e) {
      return isoString;
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.assignment_turned_in_outlined,
              size: 64,
              color: AeroTheme.grey500,
            ),
            const SizedBox(height: 16),
            const Text(
              'No se encontraron checklists',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'No hay registros que coincidan con los filtros seleccionados.',
              style: TextStyle(fontSize: 14, color: AeroTheme.grey700),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
