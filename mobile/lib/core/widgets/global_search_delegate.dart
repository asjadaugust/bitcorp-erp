import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/aero_theme.dart';

class SearchResult {
  final String id;
  final String title;
  final String subtitle;
  final String category;
  final String route;

  const SearchResult({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.category,
    required this.route,
  });
}

class GlobalSearchDelegate extends SearchDelegate<String?> {
  // Mock data source
  final List<SearchResult> defaultResults = const [
    SearchResult(
      id: 'eq-001',
      title: 'EXC-001',
      subtitle: 'Excavadora Orugas Cat 336D',
      category: 'Equipos',
      route: '/equipment/eq-001',
    ),
    SearchResult(
      id: 'eq-002',
      title: 'VOL-045',
      subtitle: 'Volquete Volvo FMX 440',
      category: 'Equipos',
      route: '/equipment/eq-002',
    ),
    SearchResult(
      id: 'dr-101',
      title: 'Parte Diario: 2026-03-01',
      subtitle: 'EXC-001 - Juan Perez',
      category: 'Partes Diarios',
      route: '/reports',
    ),
    SearchResult(
      id: 'val-001',
      title: 'Vale: VC-9921',
      subtitle: '50 Gls Diesel - EXC-001',
      category: 'Vales de Combustible',
      route: '/vouchers',
    ),
    SearchResult(
      id: 'chk-001',
      title: 'Checklist Semanal',
      subtitle: 'VOL-045 - Aprobado',
      category: 'Checklists',
      route: '/checklists',
    ),
  ];

  @override
  String get searchFieldLabel => 'Buscar...';

  @override
  TextStyle? get searchFieldStyle =>
      const TextStyle(color: AeroTheme.primary900, fontSize: 16);

  @override
  ThemeData appBarTheme(BuildContext context) {
    return ThemeData(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: InputBorder.none,
      ),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) {
    if (query.isEmpty) return null;
    return [
      IconButton(
        icon: const Icon(Icons.clear, color: AeroTheme.primary500),
        onPressed: () {
          query = '';
          showSuggestions(context);
        },
      ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildResultList(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search, size: 64, color: AeroTheme.grey300),
            SizedBox(height: 16),
            Text(
              'Búsqueda Global',
              style: TextStyle(fontSize: 18, color: AeroTheme.grey500),
            ),
            SizedBox(height: 8),
            Text(
              'Busca equipos, partes diarios, vales, etc.',
              style: TextStyle(color: AeroTheme.grey500),
            ),
          ],
        ),
      );
    }

    return _buildResultList(context);
  }

  Widget _buildResultList(BuildContext context) {
    final lowerQuery = query.toLowerCase();

    // Filter results
    final filtered = defaultResults.where((r) {
      return r.title.toLowerCase().contains(lowerQuery) ||
          r.subtitle.toLowerCase().contains(lowerQuery) ||
          r.id.toLowerCase().contains(lowerQuery);
    }).toList();

    if (filtered.isEmpty) {
      return const Center(
        child: Text(
          'No se encontraron resultados',
          style: TextStyle(color: AeroTheme.grey500),
        ),
      );
    }

    // Group by category
    final grouped = <String, List<SearchResult>>{};
    for (var r in filtered) {
      grouped.putIfAbsent(r.category, () => []).add(r);
    }

    return ListView.builder(
      itemCount: grouped.keys.length,
      itemBuilder: (context, index) {
        final category = grouped.keys.elementAt(index);
        final items = grouped[category]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                category,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AeroTheme.primary500,
                  fontSize: 12,
                ),
              ),
            ),
            ...items.map(
              (item) => ListTile(
                leading: _getCategoryIcon(category),
                title: Text(
                  item.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AeroTheme.primary900,
                  ),
                ),
                subtitle: Text(
                  item.subtitle,
                  style: const TextStyle(color: AeroTheme.grey500),
                ),
                onTap: () {
                  close(context, null);
                  context.push(item.route);
                },
              ),
            ),
            const Divider(height: 1, color: AeroTheme.grey200),
          ],
        );
      },
    );
  }

  Widget _getCategoryIcon(String category) {
    IconData icon;
    switch (category) {
      case 'Equipos':
        icon = Icons.agriculture;
        break;
      case 'Partes Diarios':
        icon = Icons.assignment;
        break;
      case 'Vales de Combustible':
        icon = Icons.local_gas_station;
        break;
      case 'Checklists':
        icon = Icons.fact_check;
        break;
      case 'Aprobaciones':
        icon = Icons.verified_user;
        break;
      default:
        icon = Icons.folder;
    }
    return CircleAvatar(
      backgroundColor: AeroTheme.primary100,
      foregroundColor: AeroTheme.primary500,
      child: Icon(icon, size: 20),
    );
  }
}
