import 'package:dio/dio.dart';
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
  final Dio _dio;

  GlobalSearchDelegate(this._dio);

  @override
  String get searchFieldLabel => 'Buscar equipos, reportes...';

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
    return _buildSearchResults(context);
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
              'Busca equipos, partes diarios y más.',
              style: TextStyle(color: AeroTheme.grey500),
            ),
          ],
        ),
      );
    }

    if (query.length < 2) {
      return const Center(
        child: Text(
          'Escribe al menos 2 caracteres para buscar',
          style: TextStyle(color: AeroTheme.grey500),
        ),
      );
    }

    return _buildSearchResults(context);
  }

  Widget _buildSearchResults(BuildContext context) {
    return FutureBuilder<List<SearchResult>>(
      future: _performSearch(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AeroTheme.primary500),
          );
        }

        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AeroTheme.grey500),
                const SizedBox(height: 16),
                Text(
                  'Error al buscar',
                  style: TextStyle(color: AeroTheme.grey700, fontSize: 16),
                ),
              ],
            ),
          );
        }

        final results = snapshot.data ?? [];
        if (results.isEmpty) {
          return const Center(
            child: Text(
              'No se encontraron resultados',
              style: TextStyle(color: AeroTheme.grey500),
            ),
          );
        }

        // Group by category
        final grouped = <String, List<SearchResult>>{};
        for (var r in results) {
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
      },
    );
  }

  Future<List<SearchResult>> _performSearch(String searchQuery) async {
    final results = <SearchResult>[];

    // Query equipment and reports in parallel
    final futures = await Future.wait([
      _searchEquipment(searchQuery),
      _searchReports(searchQuery),
    ]);

    results.addAll(futures[0]);
    results.addAll(futures[1]);

    return results;
  }

  Future<List<SearchResult>> _searchEquipment(String q) async {
    try {
      final response = await _dio.get(
        '/equipment/',
        queryParameters: {'search': q, 'limit': 5},
      );
      final data = response.data['data'] as List? ?? [];
      return data.map<SearchResult>((e) {
        final id = e['id'].toString();
        final code = e['codigo_equipo'] as String? ?? '';
        final marca = e['marca'] as String? ?? '';
        final modelo = e['modelo'] as String? ?? '';
        final desc = '$marca $modelo'.trim();
        return SearchResult(
          id: id,
          title: code,
          subtitle: desc.isNotEmpty ? desc : 'Equipo',
          category: 'Equipos',
          route: '/equipment/$id',
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<SearchResult>> _searchReports(String q) async {
    try {
      final response = await _dio.get(
        '/reports/',
        queryParameters: {'search': q, 'limit': 5},
      );
      final data = response.data['data'] as List? ?? [];
      return data.map<SearchResult>((e) {
        final id = e['id'].toString();
        final fecha = e['fecha'] as String? ?? '';
        final equipo = e['codigo_equipo'] as String? ?? '';
        final operador = e['operador_nombre'] as String? ?? '';
        return SearchResult(
          id: id,
          title: 'Parte Diario: $fecha',
          subtitle: '$equipo - $operador'.trim(),
          category: 'Partes Diarios',
          route: '/reports',
        );
      }).toList();
    } catch (_) {
      return [];
    }
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
