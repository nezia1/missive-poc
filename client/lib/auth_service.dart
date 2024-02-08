import 'package:http/http.dart' as http;
import 'dart:convert';
import 'constants.dart';

// this abstract class is used to represent the result of a login attempt
// this is needed because the login attempt can result in different outcomes, and we want to be able to represent those outcomes in a type-safe way
// it does not contain anything because we don't have any common properties between the different outcomes, this is just to have a generic type that we can return from the login function
abstract class LoginResult {}

// when the login attempt is successful, we have to return the refresh token and the access token
class LoginSuccess extends LoginResult {
  final String refreshToken;
  final String accessToken;

  LoginSuccess(this.refreshToken, this.accessToken);
}

class LoginFailure extends LoginResult {
  final AuthStatus status;
  LoginFailure(this.status);
}

enum AuthStatus { totpRequired, invalidCredentials, totpInvalid, error }

// TODO separate login and TOTP login into two different functions (TOTP login should be a separate function returning a boolean to make it easier and clearer to handle the UI)
class AuthService {
  AuthService._();

  /// Logs in a user and returns a [LoginResult] object representing the result of the login attempt. If a TOTP is supplied, it will be used to complete the login process.
  static Future<LoginResult> login(String name, String password,
      [String? totp]) async {
    try {
      final requestBody = jsonEncode(
          {'name': name, 'password': password, if (totp != null) 'totp': totp});

      final response = await http.post(Uri.parse('${Constants.baseUrl}/tokens'),
          headers: {'Content-Type': 'application/json'}, body: requestBody);

      final jsonBody = jsonDecode(response.body);

      // 200 represents a successful login attempt, but the user needs to provide a TOTP
      if (response.statusCode == 200 && jsonBody['status'] == 'totp_required') {
        return LoginFailure(AuthStatus.totpRequired);
      }

      // 401 represents either invalid credentials or an invalid TOTP
      if (response.statusCode == 401) {
        if (jsonBody['status'] == 'totp_invalid') {
          return LoginFailure(AuthStatus.totpInvalid);
        }
        return LoginFailure(AuthStatus.invalidCredentials);
      }

      final accessToken = jsonBody['accessToken'];

      // the set-cookie header is not accessible from the http package, so we have to parse it manually
      final refreshToken = response.headers['set-cookie']
          ?.split(';')
          .firstWhere((cookie) => cookie.contains('refreshToken'))
          .split('=')
          .last;

      // the refresh token will always be present in the response, so we can safely use the `!` operator here
      return LoginSuccess(refreshToken!, accessToken);
    } catch (e) {
      // TODO: improve error handling
      print(e);
      return LoginFailure(AuthStatus.error);
    }
  }
}
