import 'package:flutter_riverpod/flutter_riverpod.dart';

// Mock list of available projects for the operator
const availableProjects = [
  {'id': 'proj-1', 'nombre': 'Minera Alpha'},
  {'id': 'proj-2', 'nombre': 'Construcción Beta'},
  {'id': 'proj-3', 'nombre': 'Mantenimiento Gamma'},
];

class GlobalProjectNotifier extends Notifier<String?> {
  @override
  String? build() {
    return availableProjects.first['id'];
  }

  void setProject(String? id) {
    state = id;
  }
}

final globalProjectProvider = NotifierProvider<GlobalProjectNotifier, String?>(
  () => GlobalProjectNotifier(),
);
