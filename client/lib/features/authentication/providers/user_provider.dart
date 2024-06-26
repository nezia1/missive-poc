import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:poc_flutter_client/features/authentication/models/user.dart';
import 'package:poc_flutter_client/constants/api.dart';

/// Provides everything related to the user, such as:
/// -  authentication (login, logout, token management)
/// - profile
class UserProvider extends ChangeNotifier {
  String? _accessToken;
  bool _isLoggedIn = false;
  User? _user;
  final http.Client _httpClient;
  final FlutterSecureStorage _secureStorage;

  /// Returns the access token as [String], or null if it's not available.
  Future<String?> get accessToken async {
    final prefs = await SharedPreferences.getInstance();
    if (_accessToken != null) return _accessToken;

    return prefs.getString('accessToken');
  }

  /// Returns the currently authenticated [User], or null if it's not available.
  Future<User?> get user async {
    if (_user == null) await loadProfile();
    return _user;
  }

  bool get isLoggedIn => _isLoggedIn;

  /// Creates a new [UserProvider] with an optional [http.Client] and [FlutterSecureStorage].
  UserProvider({http.Client? httpClient, FlutterSecureStorage? secureStorage})
      : _httpClient = httpClient ?? http.Client(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage();

  /// Logs in a user and returns a [AuthenticationResult], that can either be [AuthenticationSuccess] or [AuthenticationError].
  Future<AuthenticationResult> login(String name, String password,
      [String? totp]) async {
    // regular key-value storage
    final prefs = await SharedPreferences.getInstance();

    try {
      final requestBody = jsonEncode(
          {'name': name, 'password': password, if (totp != null) 'totp': totp});

      final response = await _httpClient
          .post(Uri.parse('${ApiConstants.baseUrl}/tokens'),
              headers: {'Content-Type': 'application/json'}, body: requestBody)
          .timeout(const Duration(seconds: 5));

      final jsonBody = jsonDecode(response.body);

      // 200 represents a successful login attempt, but the user needs to provide a TOTP
      if (response.statusCode == 200 &&
          jsonBody['data']['status'] == 'totp_required') {
        return TOTPRequiredError();
      }

      // 401 represents either invalid credentials or an invalid TOTP
      if (response.statusCode == 401) {
        if (jsonBody['status'] == 'totp_invalid') {
          return TOTPInvalidError();
        }
        return InvalidCredentialsError();
      }

      final accessToken = jsonBody['data']['accessToken'];

      // the set-cookie header is not accessible from the http package, so we have to parse it manually
      final refreshToken = response.headers['set-cookie']
          ?.split(';')
          .firstWhere((cookie) => cookie.contains('refreshToken'))
          .split('=')
          .last;

      // store tokens
      _accessToken = accessToken;
      await _secureStorage.write(key: 'refreshToken', value: refreshToken);
      await prefs.setString('accessToken', accessToken);

      _isLoggedIn = true;
      notifyListeners();

      return AuthenticationSuccess();
    } on http.ClientException catch (e) {
      print(e.message);
      return AuthenticationError(e.message);
    }
  }

  /// Logs out a user and clears the stored tokens.
  /// TODO delete the refresh token from the server
  void logout() async {
    final prefs = await SharedPreferences.getInstance();
    await _secureStorage.delete(key: 'refreshToken');
    await prefs.remove('accessToken');

    _user = null;
    _accessToken = null;
    _isLoggedIn = false;
    notifyListeners();
  }

  Future<void> loadProfile() async {
    if (await accessToken == null) {
      // TODO handle/log error (this should never happen)
      return;
    }

    try {
      final response = await _httpClient
          .get(Uri.parse('${ApiConstants.baseUrl}/users/me'), headers: {
        'Authorization': 'Bearer ${await accessToken}',
      });

      User user =
          User.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      _user = user;
    } catch (e) {
      // TODO handle/log error
      print(e);
      _user = null;
    } finally {
      notifyListeners();
    }
  }
}

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

class AuthenticationTimeoutError extends AuthenticationError {
  AuthenticationTimeoutError();
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
