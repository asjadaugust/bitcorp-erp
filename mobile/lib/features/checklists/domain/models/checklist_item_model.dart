class ChecklistItemModel {
  final String id;
  final String idChecklist;
  final String nombreItem;
  final String categoria;
  final bool? aprobado; // null = untouched, true = pass, false = fail
  final String? comentario;
  final String? rutaFoto;

  const ChecklistItemModel({
    required this.id,
    required this.idChecklist,
    required this.nombreItem,
    required this.categoria,
    this.aprobado,
    this.comentario,
    this.rutaFoto,
  });

  ChecklistItemModel copyWith({
    String? id,
    String? idChecklist,
    String? nombreItem,
    String? categoria,
    bool? aprobado,
    String? comentario,
    String? rutaFoto,
  }) {
    return ChecklistItemModel(
      id: id ?? this.id,
      idChecklist: idChecklist ?? this.idChecklist,
      nombreItem: nombreItem ?? this.nombreItem,
      categoria: categoria ?? this.categoria,
      aprobado: aprobado,
      comentario: comentario ?? this.comentario,
      rutaFoto: rutaFoto ?? this.rutaFoto,
    );
  }

  // To/From SQLite Map
  factory ChecklistItemModel.fromMap(Map<String, dynamic> map) {
    return ChecklistItemModel(
      id: map['id'] as String,
      idChecklist: map['id_checklist'] as String,
      nombreItem: map['nombre_item'] as String,
      categoria: map['categoria'] as String,
      aprobado: map['aprobado'] == null ? null : (map['aprobado'] == 1),
      comentario: map['comentario'] as String?,
      rutaFoto: map['ruta_foto'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'id_checklist': idChecklist,
      'nombre_item': nombreItem,
      'categoria': categoria,
      'aprobado': aprobado == null ? null : (aprobado! ? 1 : 0),
      'comentario': comentario,
      'ruta_foto': rutaFoto,
    };
  }
}
