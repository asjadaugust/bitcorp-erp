import 'package:flutter_riverpod/flutter_riverpod.dart';

// Mock list of available projects for the operator
const availableProjects = [
  {'id': 'proj-1', 'nombre': 'Minera Alpha'},
  {'id': 'proj-2', 'nombre': 'Construcción Beta'},
  {'id': 'proj-3', 'nombre': 'Mantenimiento Gamma'},
];

// Stores the currently selected project ID.
// Null means "All" or "Unselected", though ideally we default to the first one.
final globalProjectProvider = StateProvider<String?>((ref) {
  // Default to the first project
  return availableProjects.first['id'];
});
