class ProjectModel {
  final String id;
  final String name;
  final String code;
  final String description;
  final String status;

  const ProjectModel({
    required this.id,
    required this.name,
    required this.code,
    required this.description,
    required this.status,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVO',
    );
  }
}
