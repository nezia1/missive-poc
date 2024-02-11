import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../constants/api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class LoginResult {}

class LoginSuccess extends LoginResult {
  LoginSuccess();
}

class LoginFailure extends LoginResult {
  final AuthErrorStatus status;
  LoginFailure(this.status);
}

enum AuthErrorStatus { invalidCredentials, totpRequired, totpInvalid, error }

class AuthProvider extends ChangeNotifier {
  String? _accessToken;
  bool isLoggedIn = false;

  String get accessToken => _accessToken ?? '';

  /// Logs in a user and returns a [LoginResult], that can either be [LoginSuccess] or [LoginFailure].
  Future<LoginResult> login(String name, String password,
      [String? totp]) async {
    // key-value storage for sensitive data
    const secureStorage = FlutterSecureStorage();
    // regular key-value storage
    final prefs = await SharedPreferences.getInstance();
    try {
      final requestBody = jsonEncode(
          {'name': name, 'password': password, if (totp != null) 'totp': totp});

      final response = await http.post(
          Uri.parse('${ApiConstants.baseUrl}/tokens'),
          headers: {'Content-Type': 'application/json'},
          body: requestBody);

      final jsonBody = jsonDecode(response.body);

      // 200 represents a successful login attempt, but the user needs to provide a TOTP
      if (response.statusCode == 200 && jsonBody['status'] == 'totp_required') {
        return LoginFailure(AuthErrorStatus.totpRequired);
      }

      // 401 represents either invalid credentials or an invalid TOTP
      if (response.statusCode == 401) {
        if (jsonBody['status'] == 'totp_invalid') {
          return LoginFailure(AuthErrorStatus.totpInvalid);
        }
        return LoginFailure(AuthErrorStatus.invalidCredentials);
      }

      final accessToken = jsonBody['accessToken'];

      // the set-cookie header is not accessible from the http package, so we have to parse it manually
      final refreshToken = response.headers['set-cookie']
          ?.split(';')
          .firstWhere((cookie) => cookie.contains('refreshToken'))
          .split('=')
          .last;

      // store tokens
      _accessToken = accessToken;
      await secureStorage.write(key: 'refreshToken', value: refreshToken);
      await prefs.setString('accessToken', accessToken);

      isLoggedIn = true;
      notifyListeners();

      // the refresh token will always be present in the response, so we can safely use the `!` operator here
      return LoginSuccess();
    } catch (e) {
      // TODO: improve error handling
      print(e);
      return LoginFailure(AuthErrorStatus.error);
    }
  }
}
