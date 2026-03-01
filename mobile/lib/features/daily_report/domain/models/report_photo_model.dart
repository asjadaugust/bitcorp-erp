class ReportPhotoModel {
  final String id;
  final String filePath;

  const ReportPhotoModel({required this.id, required this.filePath});

  factory ReportPhotoModel.fromJson(Map<String, dynamic> json) {
    return ReportPhotoModel(
      id: json['id'] as String,
      filePath: json['filePath'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'filePath': filePath};
  }
}
