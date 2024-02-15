class User {
  String id;
  String username;
  bool? totpEnabled;

  User({
    required this.id,
    required this.username,
    this.totpEnabled,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
        id: json['id'],
        username: json['username'],
        totpEnabled: json['totp_url']);
  }
}
