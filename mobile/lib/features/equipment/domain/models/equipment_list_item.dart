/// Lightweight model for equipment list items (dropdowns, lists).
class EquipmentListItem {
  final int id;
  final String code;
  final String description;
  final String estado;

  const EquipmentListItem({
    required this.id,
    required this.code,
    required this.description,
    required this.estado,
  });

  factory EquipmentListItem.fromJson(Map<String, dynamic> json) {
    final code = json['codigo_equipo'] as String? ?? '';
    final marca = json['marca'] as String? ?? '';
    final modelo = json['modelo'] as String? ?? '';
    return EquipmentListItem(
      id: json['id'] as int,
      code: code,
      description: '$marca $modelo'.trim(),
      estado: json['estado'] as String? ?? '',
    );
  }

  /// Display label for dropdowns: "EXC-001 (Caterpillar 336D)"
  String get displayLabel =>
      description.isNotEmpty ? '$code ($description)' : code;
}
