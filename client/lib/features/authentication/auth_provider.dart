import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../constants/api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Represents the result of an authentication attempt.
// It allows us to represent a generic result of an authentication attempt, and then have specific subtypes for different types of successes/errors so we can parse them accordingly and build our UI logic around it.
/// Generic result of an authentication attempt.
sealed class AuthenticationResult {}

/// Represents a successful authentication attempt.
class AuthenticationSuccess extends AuthenticationResult {
  AuthenticationSuccess();
}

/// Represents a generic error during an authentication attempt.
class AuthenticationError extends AuthenticationResult implements Error {
  @override
  StackTrace get stackTrace => StackTrace.current;

  final String? message;

  AuthenticationError([this.message]);
}

class InvalidCredentialsError extends AuthenticationError {
  InvalidCredentialsError();
}

class TOTPRequiredError extends AuthenticationError {
  TOTPRequiredError();
}

class TOTPInvalidError extends AuthenticationError {
  TOTPInvalidError();
}

/// Provides authentication functionality (logging in and out, storing tokens).
class AuthProvider extends ChangeNotifier {
  String? _accessToken;
  bool _isLoggedIn = false;

  String get accessToken => _accessToken ?? '';
  bool get isLoggedIn => _isLoggedIn;

  /// Logs in a user and returns a [AuthenticationResult], that can either be [AuthenticationSuccess] or [AuthenticationError].
  Future<AuthenticationResult> login(String name, String password,
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
        return TOTPRequiredError();
      }

      // 401 represents either invalid credentials or an invalid TOTP
      if (response.statusCode == 401) {
        if (jsonBody['status'] == 'totp_invalid') {
          return TOTPInvalidError();
        }
        return InvalidCredentialsError();
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

      _isLoggedIn = true;
      notifyListeners();

      return AuthenticationSuccess();
    } on http.ClientException catch (e) {
      print(e.message);
      return AuthenticationError(e.message);
    }
  }
}
