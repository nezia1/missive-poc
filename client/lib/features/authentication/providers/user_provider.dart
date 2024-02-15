import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:poc_flutter_client/features/authentication/models/user.dart';
import 'package:poc_flutter_client/features/authentication/providers/auth_provider.dart';
import 'package:poc_flutter_client/constants/api.dart';

class UserProvider extends ChangeNotifier {
  User? _user;

  User? get user => _user;

  Future<void> getProfile() async {
    AuthProvider authProvider = AuthProvider();
    if (await authProvider.accessToken == null) {
      // TODO handle/log error (this should never happen)
      return;
    }
  }
}
