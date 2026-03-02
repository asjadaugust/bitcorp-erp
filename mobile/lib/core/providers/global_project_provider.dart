import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/domain/models/project_model.dart';
import 'package:mobile/core/network/dio_client.dart';

/// Provider for the list of available projects from the tenant API.
final projectListProvider =
    AsyncNotifierProvider<ProjectListNotifier, List<ProjectModel>>(
  () => ProjectListNotifier(),
);

class ProjectListNotifier extends AsyncNotifier<List<ProjectModel>> {
  @override
  Future<List<ProjectModel>> build() async {
    return _fetchProjects();
  }

  Future<List<ProjectModel>> _fetchProjects() async {
    try {
      final dio = ref.watch(dioProvider);
      final response = await dio.get('/tenant/my-projects');

      // Endpoint returns a plain array (no {success, data} wrapper)
      final List<dynamic> data = response.data is List
          ? response.data as List<dynamic>
          : (response.data['data'] as List<dynamic>?) ?? [];

      return data
          .map((json) => ProjectModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Projects API unavailable: $e, using fallback');
      }
      // Fallback for dev when backend is unreachable
      return const [
        ProjectModel(
          id: 'proj-1',
          name: 'Proyecto Principal',
          code: 'PP-001',
          description: '',
          status: 'ACTIVO',
        ),
      ];
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchProjects());
  }
}

/// Currently selected project ID.
class GlobalProjectNotifier extends Notifier<String?> {
  @override
  String? build() {
    // Auto-select first project when project list loads
    final projectList = ref.watch(projectListProvider);
    return projectList.whenData((projects) {
      if (projects.isNotEmpty) return projects.first.id;
      return null;
    }).value;
  }

  void setProject(String? id) {
    state = id;
  }
}

final globalProjectProvider = NotifierProvider<GlobalProjectNotifier, String?>(
  () => GlobalProjectNotifier(),
);
