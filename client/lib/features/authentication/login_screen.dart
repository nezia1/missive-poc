import 'package:flutter/material.dart';
import 'auth_service.dart';
import 'totp_modal.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.title});

  final String title;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _name = '';
  String _password = '';
  String? _totp;

  // UI state
  bool _incompleteCredentials = false,
      _invalidCredentials = false,
      _totpRequired = false;

  Future<void> handleLogin() async {
    // reset state but don't rebuild the widget
    _incompleteCredentials = false;
    _invalidCredentials = false;
    _totpRequired = false;

    final authService = AuthService();

    if (_name.trim() == '' || _password.trim() == '') {
      setState(() => _incompleteCredentials = true);
      return;
    }

    final loginResult = await authService.login(_name, _password, _totp);

    if (loginResult is LoginFailure) {
      switch (loginResult.status) {
        case AuthStatus.totpRequired:
          setState(() => _totpRequired = true);
          break;
        case AuthStatus.invalidCredentials:
          setState(() => _invalidCredentials = true);
          setState(() => _totpRequired = false);
          break;
        // TODO implement page navigation after successful login
        default:
          // TODO handle error (and send it from the function)
          break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.only(left: 80.0, right: 80.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              TextField(
                  style: Theme.of(context).textTheme.bodyMedium,
                  decoration: const InputDecoration(labelText: 'Name'),
                  onChanged: (value) => _name = value),
              TextField(
                style: Theme.of(context).textTheme.bodyMedium,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                onChanged: (value) => _password = value,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                  child: const Text('Login'),
                  onPressed: () async {
                    await handleLogin();
                    if (_totpRequired) {
                      if (!context.mounted) return;
                      showModalBottomSheet(
                          context: context,
                          builder: (BuildContext context) {
                            return TOTPModal(
                              onHandleTotp: (totp) async {
                                final authService = AuthService();
                                final loginResult = await authService.login(
                                    _name, _password, totp);

                                if (loginResult is LoginFailure) {
                                  // TODO handle/log AuthStatus.error  (any other error than totpInvalid is concerning)
                                  return false;
                                }

                                if (loginResult is LoginSuccess) {
                                  // TODO redirect to home page
                                }

                                return true;
                              },
                            );
                          });
                    }
                  }),
              if (_invalidCredentials) const Text('Invalid Credentials'),
              if (_incompleteCredentials) const Text('Incomplete Credentials')
            ],
          ),
        ),
      ),
    );
  }
}
