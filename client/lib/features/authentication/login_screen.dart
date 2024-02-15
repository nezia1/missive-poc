import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'auth_provider.dart';
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
  String? _errorMessage;

  bool _totpRequired = false;

  Future<void> handleLogin() async {
    // reset state but don't rebuild the widget
    _totpRequired = false;
    _errorMessage = '';

    if (_name.trim() == '' || _password.trim() == '') {
      setState(() {
        _errorMessage = 'Please fill in all fields';
      });
      return;
    }

    final loginResult = await Provider.of<AuthProvider>(context, listen: false)
        .login(_name, _password, _totp);

    switch (loginResult) {
      case TOTPRequiredError():
        setState(() => _totpRequired = true);
      case InvalidCredentialsError():
        setState(() => _errorMessage = 'Your credentials are invalid');
      case AuthenticationError():
        // TODO handle/log error
        print(loginResult.message);
      default:
        break;
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
                            return TOTPModal(onHandleTotp: (totp) async {
                              final loginResult =
                                  await Provider.of<AuthProvider>(context,
                                          listen: false)
                                      .login(_name, _password, totp);
                              switch (loginResult) {
                                case AuthenticationSuccess():
                                  return true;
                                case TOTPInvalidError():
                                  return false;
                                case AuthenticationError():
                                  print(loginResult.message);
                                  // TODO handle/log AuthStatus.error  (a generic error here is concerning)
                                  return false;
                              }
                            });
                          });
                    }
                  }),
              if (_errorMessage != null) Text(_errorMessage!),
            ],
          ),
        ),
      ),
    );
  }
}
