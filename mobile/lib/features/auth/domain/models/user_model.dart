class UserModel {
  final int id;
  final String uid;
  final String email;
  final String fullName;
  final String role;

  const UserModel({
    required this.id,
    required this.uid,
    required this.email,
    required this.fullName,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      uid: json['uid'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      role: json['role'] as String,
    );
  }
}
