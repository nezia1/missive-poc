class User {
  String id;
  String name;
  bool? totpEnabled;

  User({
    required this.id,
    required this.name,
    this.totpEnabled,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
        id: json['id'], name: json['name'], totpEnabled: json['totp_url']);
  }
}
